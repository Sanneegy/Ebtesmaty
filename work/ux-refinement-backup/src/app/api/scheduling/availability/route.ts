import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

const STANDARD_SLOTS = [
  { time: '09:00', label: '09:00 AM', window: 'MORNING' },
  { time: '09:45', label: '09:45 AM', window: 'MORNING' },
  { time: '10:30', label: '10:30 AM', window: 'MORNING' },
  { time: '11:15', label: '11:15 AM', window: 'MORNING' },
  { time: '12:00', label: '12:00 PM', window: 'MORNING' },
  { time: '13:00', label: '01:00 PM', window: 'AFTERNOON' },
  { time: '13:45', label: '01:45 PM', window: 'AFTERNOON' },
  { time: '14:30', label: '02:30 PM', window: 'AFTERNOON' },
  { time: '15:15', label: '03:15 PM', window: 'AFTERNOON' },
  { time: '16:00', label: '04:00 PM', window: 'AFTERNOON' },
  { time: '17:00', label: '05:00 PM', window: 'EVENING' },
  { time: '17:45', label: '05:45 PM', window: 'EVENING' },
  { time: '18:30', label: '06:30 PM', window: 'EVENING' },
  { time: '19:15', label: '07:15 PM', window: 'EVENING' },
  { time: '20:00', label: '08:00 PM', window: 'EVENING' },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchCode = searchParams.get('branchCode') || 'BR-A';
    const dateStr =
      searchParams.get('date') ||
      new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const dentistEmail = searchParams.get('dentistEmail') || 'ANY';

    const branch = await db.branch.findUnique({ where: { code: branchCode } });
    if (!branch) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
    }

    const dayStart = new Date(`${dateStr}T00:00:00.000Z`);
    const dayEnd = new Date(`${dateStr}T23:59:59.999Z`);

    let targetDentistId: string | undefined;
    if (dentistEmail && dentistEmail !== 'ANY') {
      const doc = await db.user.findUnique({ where: { email: dentistEmail } });
      if (doc) targetDentistId = doc.id;
    }

    const existingAppointments = await db.appointment.findMany({
      where: {
        branchId: branch.id,
        ...(targetDentistId ? { dentistUserId: targetDentistId } : {}),
        appointmentDate: { gte: dayStart, lte: dayEnd },
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      },
      select: {
        startTime: true,
        endTime: true,
        dentistUserId: true,
      },
    });

    const duties = await db.doctorDuty.findMany({
      where: {
        branchId: branch.id,
        dutyDate: { gte: dayStart, lte: dayEnd },
      },
      include: {
        dentistUser: { select: { id: true, fullName: true, email: true } },
      },
    });

    const slots = STANDARD_SLOTS.map((s) => {
      const overlappingCount = existingAppointments.filter((a) => {
        return a.startTime === s.time;
      }).length;

      const maxParallel = targetDentistId ? 1 : 2;
      const available = overlappingCount < maxParallel;

      return {
        ...s,
        available,
      };
    });

    return NextResponse.json({
      branchCode,
      date: dateStr,
      duties: duties.map((d) => ({
        dentistId: d.dentistUserId,
        dentistName: d.dentistUser.fullName,
        dentistEmail: d.dentistUser.email,
      })),
      slots,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to compute availability' },
      { status: 400 }
    );
  }
}
