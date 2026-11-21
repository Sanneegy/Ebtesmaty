import { db } from '../lib/db';
import { 
  AppointmentRequestStatus, 
  AppointmentStatus, 
  QueueType, 
  QueueStatus, 
  DutyStatus, 
  FollowUpStatus,
  NotificationType,
  AlertType
} from '@prisma/client';
import { logAuditEvent } from '../lib/audit';

export interface CreateRequestInput {
  patientId: string;
  branchId: string;
  dentistPreferenceId?: string;
  serviceName?: string;
  preferredDate: Date | string;
  preferredTimeWindow: string; // "MORNING" | "AFTERNOON" | "EVENING"
  reason: string;
}

export interface ConfirmAppointmentInput {
  dentistUserId: string;
  roomId?: string;
  appointmentDate: Date | string;
  startTime: string; // "11:30"
  endTime: string;   // "12:15"
  durationMinutes?: number;
  serviceDescription: string;
}

/**
 * 1. Patient creates an appointment request (Does NOT reserve capacity or confirm)
 */
export async function createAppointmentRequest(
  input: CreateRequestInput,
  actor?: { id?: string; role?: string }
) {
  const reqDate = typeof input.preferredDate === 'string' ? new Date(input.preferredDate) : input.preferredDate;

  const request = await db.appointmentRequest.create({
    data: {
      patientId: input.patientId,
      branchId: input.branchId,
      dentistPreferenceId: input.dentistPreferenceId,
      serviceName: input.serviceName,
      preferredDate: reqDate,
      preferredTimeWindow: input.preferredTimeWindow,
      reason: input.reason,
      status: AppointmentRequestStatus.REQUESTED,
    },
    include: {
      patient: true,
      branch: true,
    },
  });

  if (actor?.id) {
    await logAuditEvent({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'APPOINTMENT_REQUEST_CREATED',
      entityType: 'AppointmentRequest',
      entityId: request.id,
      branchId: input.branchId,
      metadata: { serviceName: input.serviceName, preferredTimeWindow: input.preferredTimeWindow },
    });
  }

  return request;
}

/**
 * 2. Receptionist reviews request: CONFIRM, PROPOSE_ALTERNATIVE, or DECLINE
 */
export async function reviewAppointmentRequest(
  requestId: string,
  action: 'CONFIRM' | 'PROPOSE_ALTERNATIVE' | 'DECLINE',
  payload: {
    confirmData?: ConfirmAppointmentInput;
    alternativeDate?: Date | string;
    alternativeTime?: string;
    staffNotes?: string;
  },
  actor: { id: string; role: string; branchId?: string }
) {
  const req = await db.appointmentRequest.findUnique({
    where: { id: requestId },
    include: { patient: true, branch: true },
  });

  if (!req) {
    throw new Error('Appointment request not found.');
  }

  if (action === 'DECLINE') {
    const updated = await db.appointmentRequest.update({
      where: { id: requestId },
      data: {
        status: AppointmentRequestStatus.DECLINED,
        staffNotes: payload.staffNotes,
      },
    });

    // Notify patient
    const portalLink = await db.portalPatientLink.findFirst({
      where: { patientId: req.patientId, status: 'APPROVED' },
    });
    if (portalLink) {
      await db.notification.create({
        data: {
          userId: portalLink.userId,
          title: 'Appointment Request Update',
          body: `Your visit request for ${req.branch.name} could not be scheduled: ${payload.staffNotes || 'Please call the branch.'}`,
          type: NotificationType.STATUS_UPDATE,
        },
      });
    }

    return { request: updated, appointment: null };
  }

  if (action === 'PROPOSE_ALTERNATIVE') {
    if (!payload.alternativeDate || !payload.alternativeTime) {
      throw new Error('Alternative date and time window are required.');
    }
    const altDate = typeof payload.alternativeDate === 'string' ? new Date(payload.alternativeDate) : payload.alternativeDate;

    const updated = await db.appointmentRequest.update({
      where: { id: requestId },
      data: {
        status: AppointmentRequestStatus.ALTERNATIVE_PROPOSED,
        alternativeOfferedDate: altDate,
        alternativeOfferedTime: payload.alternativeTime,
        staffNotes: payload.staffNotes,
      },
    });

    // Notify patient
    const portalLink = await db.portalPatientLink.findFirst({
      where: { patientId: req.patientId, status: 'APPROVED' },
    });
    if (portalLink) {
      await db.notification.create({
        data: {
          userId: portalLink.userId,
          title: 'Alternative Appointment Offered',
          body: `Ebtesamty proposed an alternative visit slot on ${altDate.toISOString().split('T')[0]} at ${payload.alternativeTime}. Please review and respond in your portal.`,
          type: NotificationType.STATUS_UPDATE,
        },
      });
    }

    return { request: updated, appointment: null };
  }

  if (action === 'CONFIRM') {
    if (!payload.confirmData) {
      throw new Error('Confirmation parameters (doctor, date, time) are required.');
    }

    const { dentistUserId, roomId, appointmentDate, startTime, endTime, serviceDescription, durationMinutes } = payload.confirmData;
    const appDate = typeof appointmentDate === 'string' ? new Date(appointmentDate) : appointmentDate;

    // Transactional capacity and duty validation
    const result = await db.$transaction(async (tx) => {
      // 1. Verify doctor duty exists and is active for this date
      const duty = await tx.doctorDuty.findFirst({
        where: {
          dentistUserId,
          branchId: req.branchId,
          dutyDate: {
            gte: new Date(new Date(appDate).setHours(0, 0, 0, 0)),
            lte: new Date(new Date(appDate).setHours(23, 59, 59, 999)),
          },
          status: DutyStatus.CONFIRMED,
        },
      });

      if (!duty) {
        throw new Error('Selected dentist is not scheduled on confirmed duty at this branch for the chosen date.');
      }

      // 2. Prevent overlapping confirmed appointments for the same dentist
      const overlap = await tx.appointment.findFirst({
        where: {
          dentistUserId,
          appointmentDate: {
            gte: new Date(new Date(appDate).setHours(0, 0, 0, 0)),
            lte: new Date(new Date(appDate).setHours(23, 59, 59, 999)),
          },
          status: AppointmentStatus.CONFIRMED,
          AND: [
            { startTime: { lt: endTime } },
            { endTime: { gt: startTime } },
          ],
        },
      });

      if (overlap) {
        throw new Error(`Conflict: Dentist already has a confirmed booking (${overlap.startTime} - ${overlap.endTime}) overlapping this slot.`);
      }

      // 3. Create confirmed appointment
      const appointment = await tx.appointment.create({
        data: {
          requestId: req.id,
          patientId: req.patientId,
          branchId: req.branchId,
          dentistUserId,
          roomId,
          appointmentDate: appDate,
          startTime,
          endTime,
          durationMinutes: durationMinutes || 45,
          serviceDescription: serviceDescription || req.serviceName || 'Consultation',
          status: AppointmentStatus.CONFIRMED,
        },
      });

      // 4. Update request status to CONFIRMED
      const updatedReq = await tx.appointmentRequest.update({
        where: { id: requestId },
        data: { status: AppointmentRequestStatus.CONFIRMED },
      });

      return { request: updatedReq, appointment };
    });

    // Notify patient
    const portalLink = await db.portalPatientLink.findFirst({
      where: { patientId: req.patientId, status: 'APPROVED' },
    });
    if (portalLink) {
      await db.notification.create({
        data: {
          userId: portalLink.userId,
          title: 'Appointment Confirmed',
          body: `Your appointment at ${req.branch.name} is confirmed for ${new Date(appDate).toLocaleDateString()} at ${startTime}.`,
          type: NotificationType.APPOINTMENT_REMINDER,
        },
      });
    }

    await logAuditEvent({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'APPOINTMENT_CONFIRMED',
      entityType: 'Appointment',
      entityId: result.appointment.id,
      branchId: req.branchId,
      metadata: { dentistUserId, startTime, endTime },
    });

    return result;
  }

  throw new Error('Unsupported action.');
}

/**
 * 3. Patient accepts or declines an alternative slot offer
 */
export async function patientRespondToAlternative(
  requestId: string,
  response: 'ACCEPT' | 'DECLINE',
  dentistUserId: string,
  actor: { id: string; role: string }
) {
  const req = await db.appointmentRequest.findUnique({
    where: { id: requestId },
    include: { patient: true, branch: true },
  });

  if (!req || req.status !== AppointmentRequestStatus.ALTERNATIVE_PROPOSED) {
    throw new Error('Valid pending alternative offer not found for this request.');
  }

  if (response === 'DECLINE') {
    return await db.appointmentRequest.update({
      where: { id: requestId },
      data: { status: AppointmentRequestStatus.DECLINED },
    });
  }

  // ACCEPT: Confirm the alternative slot
  if (!req.alternativeOfferedDate || !req.alternativeOfferedTime) {
    throw new Error('Offer details missing.');
  }

  return await db.$transaction(async (tx) => {
    const appointment = await tx.appointment.create({
      data: {
        requestId: req.id,
        patientId: req.patientId,
        branchId: req.branchId,
        dentistUserId,
        appointmentDate: req.alternativeOfferedDate!,
        startTime: req.alternativeOfferedTime!,
        endTime: '12:00', // standard window
        durationMinutes: 45,
        serviceDescription: req.serviceName || 'Consultation',
        status: AppointmentStatus.CONFIRMED,
      },
    });

    const updated = await tx.appointmentRequest.update({
      where: { id: requestId },
      data: { status: AppointmentRequestStatus.CONFIRMED },
    });

    return { request: updated, appointment };
  });
}

/**
 * 4. Cancel appointment & free slot transactionally
 */
export async function cancelAppointment(
  appointmentId: string,
  cancellationReason: string,
  actor: { id: string; role: string },
  isPatientRequest: boolean = false
) {
  const appointment = await db.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      patient: {
        include: {
          portalLinks: { where: { status: 'APPROVED' } },
        },
      },
      branch: true,
      request: true,
    },
  });

  if (!appointment) {
    throw new Error('Appointment not found.');
  }

  if (appointment.status === AppointmentStatus.CANCELLED) {
    throw new Error('Appointment is already cancelled.');
  }

  // 24-hour cancellation policy check for patient requests
  if (isPatientRequest) {
    const appointmentDateTime = new Date(appointment.appointmentDate);
    const [hours, minutes] = (appointment.startTime || '09:00').split(':').map(Number);
    appointmentDateTime.setHours(hours || 9, minutes || 0, 0, 0);

    const now = new Date();
    const diffHours = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffHours < 24 && diffHours > 0) {
      throw new Error(
        'Clinic Cancellation Policy: Online cancellations require at least 24 hours advance notice. Please call the reception desk directly to process same-day cancellations.'
      );
    }
  }

  return db.$transaction(async (tx) => {
    const updated = await tx.appointment.update({
      where: { id: appointmentId },
      data: {
        status: AppointmentStatus.CANCELLED,
        cancellationReason,
      },
    });

    if (appointment.requestId) {
      await tx.appointmentRequest.update({
        where: { id: appointment.requestId },
        data: { status: AppointmentRequestStatus.CANCELLED },
      });
    }

    await tx.queueEntry.updateMany({
      where: { appointmentId, status: QueueStatus.WAITING },
      data: { status: QueueStatus.DEPARTED_UNSEEN },
    });

    const portalUser = appointment.patient.portalLinks[0];
    if (portalUser) {
      await tx.notification.create({
        data: {
          userId: portalUser.userId,
          title: 'Appointment Cancelled',
          body: `Your visit at ${appointment.branch.name} on ${new Date(appointment.appointmentDate).toLocaleDateString()} at ${appointment.startTime} has been cancelled. Reason: ${cancellationReason}`,
          type: NotificationType.STATUS_UPDATE,
        },
      });
    }

    await logAuditEvent({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'APPOINTMENT_CANCELLED',
      entityType: 'Appointment',
      entityId: appointmentId,
      branchId: appointment.branchId,
      metadata: { reason: cancellationReason, isPatientRequest },
    });

    return updated;
  });
}

/**
 * 5. Mark appointment as No-Show
 */
export async function markAppointmentNoShow(
  appointmentId: string,
  reason: string,
  actor: { id: string; role: string }
) {
  const app = await db.appointment.findUnique({
    where: { id: appointmentId },
  });
  if (!app) throw new Error('Appointment not found.');

  const updated = await db.appointment.update({
    where: { id: appointmentId },
    data: {
      status: AppointmentStatus.NO_SHOW,
      cancellationReason: reason,
    },
  });

  await logAuditEvent({
    actorUserId: actor.id,
    actorRole: actor.role,
    action: 'APPOINTMENT_NO_SHOW',
    entityType: 'Appointment',
    entityId: appointmentId,
    branchId: app.branchId,
    metadata: { reason },
  });

  return updated;
}

/**
 * 6. Patient reports arrival on site: "I've Arrived" (ARRIVAL_REPORTED)
 * Does NOT enter live queue until receptionist physically verifies presence!
 */
export async function reportPatientArrival(
  patientId: string,
  branchId: string,
  appointmentId?: string
) {
  // Check if an unverified arrival event already exists today
  const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
  const existing = await db.arrivalEvent.findFirst({
    where: {
      patientId,
      branchId,
      reportedAt: { gte: todayStart },
      isVerified: false,
    },
  });

  if (existing) {
    return existing;
  }

  const arrival = await db.arrivalEvent.create({
    data: {
      patientId,
      branchId,
      appointmentId,
      isVerified: false,
      reportedAt: new Date(),
    },
    include: {
      patient: true,
      appointment: true,
    },
  });

  return arrival;
}

/**
 * 7. Receptionist verifies physical presence (ARRIVAL_VERIFIED) and admits to Live Queue
 * Prevents duplicate active admissions for the same patient today.
 */
export async function verifyArrivalAndAdmitToQueue(
  arrivalEventId: string,
  actor: { id: string; role: string; branchId?: string }
) {
  const arrival = await db.arrivalEvent.findUnique({
    where: { id: arrivalEventId },
    include: { appointment: true },
  });

  if (!arrival) {
    throw new Error('Arrival event not found.');
  }

  return await db.$transaction(async (tx) => {
    // 1. Mark arrival event verified
    const verifiedArrival = await tx.arrivalEvent.update({
      where: { id: arrivalEventId },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
        verifiedByUserId: actor.id,
      },
    });

    // 2. If tied to an appointment, update appointment status to CHECKED_IN
    if (arrival.appointmentId) {
      await tx.appointment.update({
        where: { id: arrival.appointmentId },
        data: { status: AppointmentStatus.CHECKED_IN },
      });
    }

    // 3. Check for existing active queue entry today
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
    const existingQueue = await tx.queueEntry.findFirst({
      where: {
        patientId: arrival.patientId,
        branchId: arrival.branchId,
        enteredAt: { gte: todayStart },
        status: { in: [QueueStatus.WAITING, QueueStatus.CALLED, QueueStatus.IN_CONSULTATION] },
      },
    });

    if (existingQueue) {
      return { arrival: verifiedArrival, queueEntry: existingQueue };
    }

    // 4. Calculate next sequential queue number for branch today
    const countToday = await tx.queueEntry.count({
      where: {
        branchId: arrival.branchId,
        enteredAt: { gte: todayStart },
      },
    });

    const queueNumber = countToday + 1;

    // 5. Create queue entry
    const queueEntry = await tx.queueEntry.create({
      data: {
        patientId: arrival.patientId,
        branchId: arrival.branchId,
        appointmentId: arrival.appointmentId,
        arrivalEventId: arrival.id,
        dentistUserId: arrival.appointment?.dentistUserId,
        queueNumber,
        queueType: arrival.appointmentId ? QueueType.BOOKED : QueueType.WALK_IN,
        status: QueueStatus.WAITING,
        enteredAt: new Date(),
      },
      include: {
        patient: true,
      },
    });

    return { arrival: verifiedArrival, queueEntry };
  });
}

/**
 * 8. Receptionist admits offline walk-in patient directly to queue
 */
export async function admitDirectWalkIn(
  patientId: string,
  branchId: string,
  dentistUserId: string | undefined,
  priorityReason: string | undefined,
  actor: { id: string; role: string }
) {
  const todayStart = new Date(new Date().setHours(0, 0, 0, 0));

  return await db.$transaction(async (tx) => {
    // Check existing active queue entry
    const existingQueue = await tx.queueEntry.findFirst({
      where: {
        patientId,
        branchId,
        enteredAt: { gte: todayStart },
        status: { in: [QueueStatus.WAITING, QueueStatus.CALLED, QueueStatus.IN_CONSULTATION] },
      },
    });

    if (existingQueue) {
      throw new Error('Patient is already in the active waiting queue for this branch today.');
    }

    // Count today's queue
    const countToday = await tx.queueEntry.count({
      where: {
        branchId,
        enteredAt: { gte: todayStart },
      },
    });

    const queueNumber = countToday + 1;

    const queueEntry = await tx.queueEntry.create({
      data: {
        patientId,
        branchId,
        dentistUserId,
        queueNumber,
        queueType: QueueType.WALK_IN,
        status: QueueStatus.WAITING,
        enteredAt: new Date(),
        priorityReason,
      },
      include: { patient: true },
    });

    await logAuditEvent({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'WALK_IN_ADMITTED_TO_QUEUE',
      entityType: 'QueueEntry',
      entityId: queueEntry.id,
      branchId,
      metadata: { queueNumber },
    });

    return queueEntry;
  });
}

/**
 * 9. Dentist / Staff calls patient from waiting queue
 */
export async function callQueuePatient(queueEntryId: string, actor: { id: string; role: string }) {
  const entry = await db.queueEntry.findUnique({ where: { id: queueEntryId } });
  if (!entry) throw new Error('Queue entry not found.');

  const updated = await db.queueEntry.update({
    where: { id: queueEntryId },
    data: {
      status: QueueStatus.CALLED,
      calledAt: new Date(),
    },
  });

  return updated;
}

/**
 * 10. Start clinical consultation
 */
export async function startConsultation(queueEntryId: string, actor: { id: string; role: string }) {
  const entry = await db.queueEntry.findUnique({
    where: { id: queueEntryId },
    include: { appointment: true },
  });
  if (!entry) throw new Error('Queue entry not found.');

  return await db.$transaction(async (tx) => {
    const updatedQueue = await tx.queueEntry.update({
      where: { id: queueEntryId },
      data: {
        status: QueueStatus.IN_CONSULTATION,
        startedAt: new Date(),
      },
    });

    if (entry.appointmentId) {
      await tx.appointment.update({
        where: { id: entry.appointmentId },
        data: { status: AppointmentStatus.IN_CONSULTATION },
      });
    }

    return updatedQueue;
  });
}

/**
 * 11. Complete consultation
 */
export async function completeConsultation(queueEntryId: string, actor: { id: string; role: string }) {
  const entry = await db.queueEntry.findUnique({
    where: { id: queueEntryId },
    include: { appointment: true },
  });
  if (!entry) throw new Error('Queue entry not found.');

  return await db.$transaction(async (tx) => {
    const updatedQueue = await tx.queueEntry.update({
      where: { id: queueEntryId },
      data: {
        status: QueueStatus.COMPLETED,
        completedAt: new Date(),
      },
    });

    if (entry.appointmentId) {
      await tx.appointment.update({
        where: { id: entry.appointmentId },
        data: { status: AppointmentStatus.COMPLETED },
      });
    }

    return updatedQueue;
  });
}

/**
 * 12. Doctor duty assignment & absence management
 */
export async function recordDoctorDuty(
  dentistUserId: string,
  branchId: string,
  dutyDate: Date | string,
  startTime: string,
  endTime: string,
  roomId?: string,
  actor?: { id: string; role: string }
) {
  const dDate = typeof dutyDate === 'string' ? new Date(dutyDate) : dutyDate;

  return await db.doctorDuty.create({
    data: {
      dentistUserId,
      branchId,
      dutyDate: dDate,
      startTime,
      endTime,
      roomId,
      status: DutyStatus.CONFIRMED,
    },
  });
}

export async function recordDoctorAbsence(
  dentistUserId: string,
  branchId: string,
  dutyDate: Date | string,
  reason: string,
  substituteDentistId?: string,
  actor?: { id: string; role: string }
) {
  const dDate = typeof dutyDate === 'string' ? new Date(dutyDate) : dutyDate;

  return await db.$transaction(async (tx) => {
    // 1. Update duty status
    await tx.doctorDuty.updateMany({
      where: {
        dentistUserId,
        branchId,
        dutyDate: {
          gte: new Date(new Date(dDate).setHours(0, 0, 0, 0)),
          lte: new Date(new Date(dDate).setHours(23, 59, 59, 999)),
        },
      },
      data: {
        status: DutyStatus.CANCELLED,
        substituteDentistId,
      },
    });

    // 2. Count affected confirmed bookings
    const affectedCount = await tx.appointment.count({
      where: {
        dentistUserId,
        branchId,
        appointmentDate: {
          gte: new Date(new Date(dDate).setHours(0, 0, 0, 0)),
          lte: new Date(new Date(dDate).setHours(23, 59, 59, 999)),
        },
        status: AppointmentStatus.CONFIRMED,
      },
    });

    // 3. Create Coverage Exception
    const coverageException = await tx.coverageException.create({
      data: {
        branchId,
        dentistUserId,
        dutyDate: dDate,
        reason,
        affectedBookingsCount: affectedCount,
      },
    });

    // 4. Create Operational Alert for Management
    await tx.operationalAlert.create({
      data: {
        branchId,
        alertType: AlertType.DOCTOR_ABSENT_WITH_BOOKINGS,
        severity: affectedCount > 0 ? 'CRITICAL' : 'WARNING',
        title: `Doctor Absence: ${affectedCount} affected booking(s)`,
        description: `Dentist absent on ${dDate.toISOString().split('T')[0]}. Reason: ${reason}. ${affectedCount} confirmed patient visits require rescheduling or substitute coverage.`,
        entityId: coverageException.id,
      },
    });

    return { coverageException, affectedCount };
  });
}

// ==========================================
// 8. APPOINTMENT RESCHEDULING
// ==========================================

export interface RescheduleAppointmentInput {
  appointmentId: string;
  actor: { id: string; role: string };
  newDate: Date;
  preferredTimeWindow: string;
  reason: string;
  serviceDescription?: string;
}

export async function rescheduleAppointment({
  appointmentId,
  actor,
  newDate,
  preferredTimeWindow,
  reason,
  serviceDescription,
}: RescheduleAppointmentInput) {
  const appointment = await db.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      patient: {
        include: {
          portalLinks: { where: { status: 'APPROVED' } },
        },
      },
      branch: true,
    },
  });

  if (!appointment) {
    throw new Error('Appointment not found');
  }

  return db.$transaction(async (tx) => {
    // 1. Mark existing appointment as CANCELLED with reschedule note
    await tx.appointment.update({
      where: { id: appointmentId },
      data: {
        status: AppointmentStatus.CANCELLED,
        cancellationReason: `Rescheduled by patient: ${reason}`,
      },
    });

    // 2. Create new AppointmentRequest in REQUESTED state for reception review
    const newRequest = await tx.appointmentRequest.create({
      data: {
        patientId: appointment.patientId,
        branchId: appointment.branchId,
        preferredDate: newDate,
        preferredTimeWindow,
        serviceName: serviceDescription || appointment.serviceDescription,
        reason: `Reschedule of previous booking: ${reason}`,
        status: AppointmentRequestStatus.REQUESTED,
      },
    });

    // 3. Notify patient
    const portalUser = appointment.patient.portalLinks[0];
    if (portalUser) {
      await tx.notification.create({
        data: {
          userId: portalUser.userId,
          title: 'Reschedule Request Submitted',
          body: `Your request to reschedule your visit to ${newDate.toISOString().split('T')[0]} (${preferredTimeWindow}) has been sent to ${appointment.branch.name} reception for confirmation.`,
          type: NotificationType.STATUS_UPDATE,
        },
      });
    }

    // 4. Audit log
    await logAuditEvent({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'APPOINTMENT_RESCHEDULED',
      entityType: 'Appointment',
      entityId: appointmentId,
      branchId: appointment.branchId,
      metadata: { newRequestId: newRequest.id, newDate, preferredTimeWindow, reason },
    });

    return { oldAppointmentId: appointmentId, newRequest };
  });
}

