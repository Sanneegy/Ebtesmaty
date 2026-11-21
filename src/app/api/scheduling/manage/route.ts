import {getOperationalUser} from '@/lib/operational-auth';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { cancelAppointment, rescheduleAppointment } from '@/services/scheduling.service';
import db from '@/lib/db';

export async function POST(req: NextRequest) {
  const user = await getOperationalUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, appointmentId, reason, newDate, newTimeWindow, serviceDescription } = body;

    if (!appointmentId) {
      return NextResponse.json({ error: 'appointmentId is required' }, { status: 400 });
    }

    // Verify appointment ownership if patient
    const appointment = await db.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: {
          include: {
            portalLinks: true,
          },
        },
      },
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    const isPatientOwner = appointment.patient.portalLinks.some(
      (link) => link.userId === user.id && link.status === 'APPROVED'
    );
    const isStaff = user.roleGrants.some((rg) =>
      ['RECEPTIONIST', 'BRANCH_MANAGER', 'OWNER_ADMIN'].includes(rg.role)
    );

    if (!isPatientOwner && !isStaff) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to manage this booking' }, { status: 403 });
    }

    if (action === 'CANCEL') {
      const result = await cancelAppointment(
        appointmentId,
        reason || 'Patient requested cancellation via portal',
        { id: user.id, role: user.roleGrants[0]?.role || 'PATIENT' },
        isPatientOwner && !isStaff
      );
      return NextResponse.json({ success: true, result });
    }

    if (action === 'RESCHEDULE') {
      if (!newDate) {
        return NextResponse.json({ error: 'newDate is required for rescheduling' }, { status: 400 });
      }

      const result = await rescheduleAppointment({
        appointmentId,
        actor: { id: user.id, role: user.roleGrants[0]?.role || 'PATIENT' },
        newDate: new Date(newDate),
        preferredTimeWindow: newTimeWindow || 'MORNING',
        reason: reason || 'Patient requested new date via portal',
        serviceDescription,
      });
      return NextResponse.json({ success: true, result });
    }

    return NextResponse.json({ error: 'Invalid action. Supported: CANCEL, RESCHEDULE' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Operation failed' }, { status: 400 });
  }
}
