import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { availability } from '@/services/booking.service';
import { CLINIC_SERVICES } from '@/config/clinic-catalog';
import { dateOnly } from '@/lib/scheduling-rules';
import { Role } from '@/lib/prisma-shim';

export async function GET(req: Request) {
  try {
    const p = new URL(req.url).searchParams;
    const branch = await db.branch.findUnique({
      where: { code: p.get('branchCode') || 'BR-A' },
    });
    if (!branch || !branch.isActive) throw new Error('Choose an active branch.');

    const email = p.get('dentistEmail');
    const dentist =
      email && email !== 'ANY' ? await db.user.findUnique({ where: { email } }) : null;
    if (email && email !== 'ANY' && !dentist)
      throw new Error('Choose an available dentist.');

    const rawDate = String(p.get('date') || '').trim().slice(0, 10);
    const start = dateOnly(rawDate);
    const end = new Date(+start + 86400000);
    const isFriday = start.getUTCDay() === 5;

    // Auto-provision working-day (Saturday–Thursday, 10:00 AM – 9:00 PM) duties for Minya branches when none exist for the selected date
    if (!isFriday) {
      const existingCount = await db.doctorDuty.count({
        where: { branchId: branch.id, dutyDate: { gte: start, lt: end } },
      });
      if (existingCount === 0) {
        const branchDentists = await db.user.findMany({
          where: {
            status: 'ACTIVE',
            roleGrants: { some: { role: Role.DENTIST, branchId: branch.id } },
          },
          select: { id: true },
        });
        for (const doc of branchDentists) {
          await db.doctorDuty.create({
            data: {
              branchId: branch.id,
              dentistUserId: doc.id,
              dutyDate: start,
              startTime: '10:00',
              endTime: '21:00',
              status: 'CONFIRMED',
            },
          });
        }
      }
    }

    const service = CLINIC_SERVICES.find((s) => s.slug === p.get('service'));
    const duration = service?.durationMinutes || 45;
    const result = await availability(branch.id, rawDate, dentist?.id, duration);

    return NextResponse.json({
      branchCode: branch.code,
      date: rawDate,
      isFridayClosed: isFriday,
      slots: result.slots,
      duties: result.duties.map((d) => ({
        dentistId: d.dentistUserId,
        dentistName: d.dentistUser.fullName,
        dentistEmail: d.dentistUser.email,
      })),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
