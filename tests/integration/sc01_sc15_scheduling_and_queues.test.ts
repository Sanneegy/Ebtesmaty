import {checkIn,transitionVisit} from '../../src/services/visit.service';
import {cairoDate,dateOnly} from '../../src/lib/scheduling-rules';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '../../src/lib/db';
import { 
  createAppointmentRequest,
  reviewAppointmentRequest,
  patientRespondToAlternative,
  cancelAppointment,
  reportPatientArrival,
  verifyArrivalAndAdmitToQueue,
  admitDirectWalkIn,
  startConsultation,
  completeConsultation,
  recordDoctorDuty,
  recordDoctorAbsence,
} from '../../src/services/scheduling.service';
import { 
  AppointmentRequestStatus, 
  AppointmentStatus, 
  QueueStatus, 
  QueueType,
} from '@prisma/client';

describe('Checkpoint B: SC01 - SC15 Scheduling, Duty, Arrivals & Queues Integration Tests', () => {
  let branchA: any;
  let dentistSandy: any;
  let receptionistMariam: any;
  let testPatient: any;
  let hassanUser: any;
  let testStartTime: Date;

  beforeAll(async () => {
    testStartTime = new Date();
    // Locate seeded records
    branchA = await db.branch.findUnique({ where: { code: 'BR-A' } });
    expect(branchA).not.toBeNull();

    dentistSandy = await db.user.findFirst({
      where: { email: 'dr.sandy@ebtesamty.dev' },
    });
    expect(dentistSandy).not.toBeNull();

    receptionistMariam = await db.user.findFirst({
      where: { email: 'mariam.reception@ebtesamty.dev' },
    });
    expect(receptionistMariam).not.toBeNull();

    hassanUser = await db.user.findFirst({
      where: { email: 'hassan.patient@ebtesamty.dev' },
    });
    expect(hassanUser).not.toBeNull();

    testPatient = await db.patient.findFirst({
      where: { patientNumber: 'EBT-PAT-2026-0001' },
    });
    expect(testPatient).not.toBeNull();
  });

  afterAll(async () => {
    await db.operationalAlert.deleteMany({ where: { createdAt: { gte: testStartTime } } });
    await db.coverageException.deleteMany({ where: { createdAt: { gte: testStartTime } } });
    await db.queueEntry.deleteMany({ where: { enteredAt: { gte: testStartTime } } });
    await db.arrivalEvent.deleteMany({ where: { reportedAt: { gte: testStartTime } } });
    await db.appointment.deleteMany({ where: { createdAt: { gte: testStartTime } } });
    await db.appointmentRequest.deleteMany({ where: { createdAt: { gte: testStartTime } } });
    await db.doctorDuty.deleteMany({ where: { createdAt: { gte: testStartTime } } });
  });

  it('SC01: Patient submits appointment request; request is saved as REQUESTED, not confirmed', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);

    const request = await createAppointmentRequest(
      {
        patientId: testPatient.id,
        branchId: branchA.id,
        dentistPreferenceId: dentistSandy.id,
        serviceName: 'Comprehensive Dental Examination',
        preferredDate: futureDate,
        preferredTimeWindow: 'MORNING',
        reason: 'Tooth pain in upper molar',
      },
      { id: hassanUser.id, role: 'PATIENT' }
    );

    expect(request.id).toBeDefined();
    expect(request.status).toBe(AppointmentRequestStatus.REQUESTED);
    expect(request.serviceName).toBe('Comprehensive Dental Examination');

    // Verify no confirmed appointment was secretly generated
    const appt = await db.appointment.findFirst({
      where: { requestId: request.id },
    });
    expect(appt).toBeNull();
  });

  it('SC02 & SC03: Doctor duty gating — cannot confirm appointment when doctor is not on duty', async () => {
    const dutyDate = new Date();
    dutyDate.setDate(dutyDate.getDate() + 35);

    // Clean up any test fixtures for this specific date
    await db.appointment.deleteMany({
      where: {
        appointmentDate: {
          gte: new Date(new Date(dutyDate).setHours(0, 0, 0, 0)),
          lte: new Date(new Date(dutyDate).setHours(23, 59, 59, 999)),
        },
      },
    });
    await db.doctorDuty.deleteMany({
      where: {
        dutyDate: {
          gte: new Date(new Date(dutyDate).setHours(0, 0, 0, 0)),
          lte: new Date(new Date(dutyDate).setHours(23, 59, 59, 999)),
        },
      },
    });

    // Create an appointment request
    const request = await createAppointmentRequest({
      patientId: testPatient.id,
      branchId: branchA.id,
      preferredDate: dutyDate,
      preferredTimeWindow: 'MORNING',
      reason: 'Routine check-up',
    });

    // SC03: Attempt to confirm when doctor is NOT on duty -> MUST FAIL
    await expect(
      reviewAppointmentRequest(
        request.id,
        'CONFIRM',
        {
          confirmData: {
            dentistUserId: dentistSandy.id,
            appointmentDate: dutyDate,
            startTime: '10:00',
            endTime: '10:45',
            serviceDescription: 'Check-up',
          },
        },
        { id: receptionistMariam.id, role: 'RECEPTIONIST' }
      )
    ).rejects.toThrow(/no longer available/);

    // SC02: Record doctor duty for Sandy on that day, then confirm successfully
    await recordDoctorDuty(
      dentistSandy.id,
      branchA.id,
      dutyDate,
      '09:00',
      '17:00'
    );

    const result = await reviewAppointmentRequest(
      request.id,
      'CONFIRM',
      {
        confirmData: {
          dentistUserId: dentistSandy.id,
          appointmentDate: dutyDate,
          startTime: '10:00',
          endTime: '10:45',
          serviceDescription: 'Check-up',
        },
      },
      { id: receptionistMariam.id, role: 'RECEPTIONIST' }
    );

    expect(result.appointment).not.toBeNull();
    expect(result.appointment?.status).toBe(AppointmentStatus.CONFIRMED);
    expect(result.request.status).toBe(AppointmentRequestStatus.CONFIRMED);
  });

  it('SC04: Overlapping slot rejection — prevents double-booking same doctor', async () => {
    const dutyDate = new Date();
    dutyDate.setDate(dutyDate.getDate() + 40);

    // Clean up fixtures for this date
    await db.appointment.deleteMany({
      where: {
        appointmentDate: {
          gte: new Date(new Date(dutyDate).setHours(0, 0, 0, 0)),
          lte: new Date(new Date(dutyDate).setHours(23, 59, 59, 999)),
        },
      },
    });
    await db.doctorDuty.deleteMany({
      where: {
        dutyDate: {
          gte: new Date(new Date(dutyDate).setHours(0, 0, 0, 0)),
          lte: new Date(new Date(dutyDate).setHours(23, 59, 59, 999)),
        },
      },
    });

    await recordDoctorDuty(
      dentistSandy.id,
      branchA.id,
      dutyDate,
      '09:00',
      '17:00'
    );

    // Book first appointment for 11:00 - 11:45
    const req1 = await createAppointmentRequest({
      patientId: testPatient.id,
      branchId: branchA.id,
      preferredDate: dutyDate,
      preferredTimeWindow: 'MORNING',
      reason: 'First booking',
    });

    await reviewAppointmentRequest(
      req1.id,
      'CONFIRM',
      {
        confirmData: {
          dentistUserId: dentistSandy.id,
          appointmentDate: dutyDate,
          startTime: '11:00',
          endTime: '11:45',
          serviceDescription: 'Cleaning',
        },
      },
      { id: receptionistMariam.id, role: 'RECEPTIONIST' }
    );

    // Create second patient request for overlapping time 11:30 - 12:15
    const otherPatient = await db.patient.findFirst({
      where: { fullName: 'Mona Shenouda' },
    });
    expect(otherPatient).not.toBeNull();

    const req2 = await createAppointmentRequest({
      patientId: otherPatient!.id,
      branchId: branchA.id,
      preferredDate: dutyDate,
      preferredTimeWindow: 'MORNING',
      reason: 'Second booking',
    });

    // Attempting to confirm overlapping slot for Dr. Sandy must be rejected
    await expect(
      reviewAppointmentRequest(
        req2.id,
        'CONFIRM',
        {
          confirmData: {
            dentistUserId: dentistSandy.id,
            appointmentDate: dutyDate,
            startTime: '11:30',
            endTime: '12:15',
            serviceDescription: 'Consultation',
          },
        },
        { id: receptionistMariam.id, role: 'RECEPTIONIST' }
      )
    ).rejects.toThrow(/no longer available/);
  });

  it('SC05: Receptionist proposes alternative slot; patient accepts and confirms', async () => {
    const origDate = new Date();
    origDate.setDate(origDate.getDate() + 45);

    const altDate = new Date();
    altDate.setDate(altDate.getDate() + 46);

    const req = await createAppointmentRequest({
      patientId: testPatient.id,
      branchId: branchA.id,
      preferredDate: origDate,
      preferredTimeWindow: 'AFTERNOON',
      reason: 'Whitening consultation',
    });

    // Staff proposes alternative
    const review = await reviewAppointmentRequest(
      req.id,
      'PROPOSE_ALTERNATIVE',
      {
        alternativeDate: altDate,
        alternativeTime: '15:30',
        staffNotes: 'Doctor has fully booked morning, offering 3:30 PM on the next day.',
      },
      { id: receptionistMariam.id, role: 'RECEPTIONIST' }
    );

    expect(review.request.status).toBe(AppointmentRequestStatus.ALTERNATIVE_PROPOSED);

    await recordDoctorDuty(dentistSandy.id,branchA.id,altDate,'09:00','18:00');
    // Patient accepts alternative
    const accepted: any = await patientRespondToAlternative(
      req.id,
      'ACCEPT',
      dentistSandy.id,
      { id: hassanUser.id, role: 'PATIENT' }
    );

    expect(accepted.request.status).toBe(AppointmentRequestStatus.CONFIRMED);
    expect(accepted.appointment.status).toBe(AppointmentStatus.CONFIRMED);
    expect(accepted.appointment.startTime).toBe('15:30');
  });

  it('SC06: Cancel confirmed appointment frees booking slot and logs reason', async () => {
    const appDate = new Date();
    appDate.setDate(appDate.getDate() + 50);

    await db.appointment.deleteMany({
      where: {
        appointmentDate: {
          gte: new Date(new Date(appDate).setHours(0, 0, 0, 0)),
          lte: new Date(new Date(appDate).setHours(23, 59, 59, 999)),
        },
      },
    });
    await db.doctorDuty.deleteMany({
      where: {
        dutyDate: {
          gte: new Date(new Date(appDate).setHours(0, 0, 0, 0)),
          lte: new Date(new Date(appDate).setHours(23, 59, 59, 999)),
        },
      },
    });

    await recordDoctorDuty(dentistSandy.id, branchA.id, appDate, '09:00', '17:00');

    const req = await createAppointmentRequest({
      patientId: testPatient.id,
      branchId: branchA.id,
      preferredDate: appDate,
      preferredTimeWindow: 'MORNING',
      reason: 'To be cancelled',
    });

    const confirmed = await reviewAppointmentRequest(
      req.id,
      'CONFIRM',
      {
        confirmData: {
          dentistUserId: dentistSandy.id,
          appointmentDate: appDate,
          startTime: '14:00',
          endTime: '14:45',
          serviceDescription: 'Routine visit',
        },
      },
      { id: receptionistMariam.id, role: 'RECEPTIONIST' }
    );

    const cancelled = await cancelAppointment(
      confirmed.appointment!.id,
      'Patient called: urgent travel outside Cairo.',
      { id: receptionistMariam.id, role: 'RECEPTIONIST' }
    );

    expect(cancelled.status).toBe(AppointmentStatus.CANCELLED);
    expect(cancelled.cancellationReason).toContain('urgent travel');
  });

  it('SC08-SC10: only reception admits; concurrent check-in retries create one verified visit',async()=>{
    await expect(reportPatientArrival(testPatient.id,branchA.id)).rejects.toThrow(/reception/);
    await db.queueEntry.deleteMany({where:{patientId:testPatient.id}});
    const appointment=await db.appointment.create({data:{patientId:testPatient.id,branchId:branchA.id,dentistUserId:dentistSandy.id,appointmentDate:dateOnly(cairoDate()),startTime:'00:00',endTime:'00:45',serviceDescription:'Test visit'}});
    const input={patientId:testPatient.id,branchId:branchA.id,appointmentId:appointment.id};
    const reception=await db.user.findUniqueOrThrow({where:{id:receptionistMariam.id},include:{roleGrants:true}});
    const patient=await db.user.findUniqueOrThrow({where:{id:hassanUser.id},include:{roleGrants:true}});
    await expect(checkIn(input,patient)).rejects.toThrow(/permission/);
    const [first,retry]=await Promise.all([checkIn(input,reception),checkIn(input,reception)]);
    expect(first.queueEntry.id).toBe(retry.queueEntry.id);expect(first.arrival?.isVerified).toBe(true);expect(first.arrival?.verifiedByUserId).toBe(reception.id);
    expect((await db.appointment.findUniqueOrThrow({where:{id:appointment.id}})).status).toBe('CONFIRMED');
  });
  it('SC11-SC12: clinical transitions require call, treating dentist and preserve timestamps',async()=>{
    const entry=await db.queueEntry.findFirstOrThrow({where:{patientId:testPatient.id,status:'WAITING'}});
    const reception=await db.user.findUniqueOrThrow({where:{id:receptionistMariam.id},include:{roleGrants:true}});
    const dentist=await db.user.findUniqueOrThrow({where:{id:dentistSandy.id},include:{roleGrants:true}});
    await expect(admitDirectWalkIn(testPatient.id,branchA.id,dentist.id,'Urgent',{id:reception.id,role:'RECEPTIONIST'})).rejects.toThrow(/available/);
    await expect(transitionVisit(entry.id,'START',dentist)).rejects.toThrow(/changed/);
    await transitionVisit(entry.id,'CALL',reception);
    const started=await transitionVisit(entry.id,'START',reception);expect(started.startedAt).not.toBeNull();
    const completed=await transitionVisit(entry.id,'COMPLETE',dentist);expect(completed.status).toBe('COMPLETED');expect(completed.completedAt).not.toBeNull();
  });

  it('SC13: Doctor absence triggers CoverageException and Management OperationalAlert with affected booking count', async () => {
    const absenceDate = new Date();
    absenceDate.setDate(absenceDate.getDate() + 60);

    // Clean up fixtures
    await db.appointment.deleteMany({
      where: {
        appointmentDate: {
          gte: new Date(new Date(absenceDate).setHours(0, 0, 0, 0)),
          lte: new Date(new Date(absenceDate).setHours(23, 59, 59, 999)),
        },
      },
    });
    await db.doctorDuty.deleteMany({
      where: {
        dutyDate: {
          gte: new Date(new Date(absenceDate).setHours(0, 0, 0, 0)),
          lte: new Date(new Date(absenceDate).setHours(23, 59, 59, 999)),
        },
      },
    });

    // 1. Establish duty
    await recordDoctorDuty(dentistSandy.id, branchA.id, absenceDate, '09:00', '17:00');

    // 2. Book an appointment
    const req = await createAppointmentRequest({
      patientId: testPatient.id,
      branchId: branchA.id,
      preferredDate: absenceDate,
      preferredTimeWindow: 'MORNING',
      reason: 'Visit before absence',
    });

    await reviewAppointmentRequest(
      req.id,
      'CONFIRM',
      {
        confirmData: {
          dentistUserId: dentistSandy.id,
          appointmentDate: absenceDate,
          startTime: '10:00',
          endTime: '10:45',
          serviceDescription: 'Consultation',
        },
      },
      { id: receptionistMariam.id, role: 'RECEPTIONIST' }
    );

    // 3. Record doctor unexpected sick leave
    const absence = await recordDoctorAbsence(
      dentistSandy.id,
      branchA.id,
      absenceDate,
      'Sudden acute medical illness',
      undefined,
      { id: receptionistMariam.id, role: 'RECEPTIONIST' }
    );

    expect(absence.affectedCount).toBe(1);
    expect(absence.coverageException.reason).toContain('medical illness');

    // 4. Operational Alert is generated for Management Action Center
    const alert = await db.operationalAlert.findFirst({
      where: {
        entityId: absence.coverageException.id,
      },
    });

    expect(alert).not.toBeNull();
    expect(alert?.severity).toBe('CRITICAL');
    expect(alert?.title).toContain('1 affected booking');
  });
});
