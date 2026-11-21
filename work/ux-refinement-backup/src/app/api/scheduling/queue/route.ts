import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { admitDirectWalkIn } from '@/services/scheduling.service';
import { requireRole } from '@/lib/rbac';
import { Role } from '@prisma/client';
import { getCairoDayBounds } from '@/lib/cairo-date';
import { hasRole } from '@/lib/rbac';

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const branchId = searchParams.get('branchId');
  const dentistUserId = searchParams.get('dentistUserId');

  const { start: todayStart, end: tomorrowStart } = getCairoDayBounds();

  const whereClause: any = {
    enteredAt: { gte: todayStart, lt: tomorrowStart },
  };

  // Never return other branches' queues or patients' sensitive queue details.
  if (!hasRole(user, [Role.RECEPTIONIST, Role.BRANCH_MANAGER, Role.OWNER_ADMIN, Role.DENTIST])) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (branchId && !hasRole(user, [Role.RECEPTIONIST, Role.BRANCH_MANAGER, Role.OWNER_ADMIN, Role.DENTIST], branchId)) {
    return NextResponse.json({ error: 'Forbidden branch' }, { status: 403 });
  }
  const dentistOnly = hasRole(user, Role.DENTIST) &&
    !hasRole(user, [Role.RECEPTIONIST, Role.BRANCH_MANAGER, Role.OWNER_ADMIN]);
  if (dentistOnly && dentistUserId && dentistUserId !== user.id) {
    return NextResponse.json({ error: 'Forbidden clinician' }, { status: 403 });
  }
  if (dentistOnly) whereClause.dentistUserId = user.id;
  else if (dentistUserId) whereClause.dentistUserId = dentistUserId;
  const allowed = user.roleGrants.filter(g => g.role !== Role.PATIENT).map(g => g.branchId);
  if (branchId) whereClause.branchId = branchId;
  else if (!allowed.includes(null)) whereClause.branchId = { in: allowed.filter((id): id is string => !!id) };

  const queue = await db.queueEntry.findMany({
    where: whereClause,
    include: {
      patient: {
        select: {
          id: true,
          patientNumber: true,
          fullName: true,
          gender: true,
          dateOfBirth: true,
          primaryPhone: true,
          medicalSubmissions: {
            where: { status: 'REVIEWED' },
            take: 1,
            orderBy: { versionNumber: 'desc' },
          },
        },
      },
      appointment: { select: { id: true, startTime: true, serviceDescription: true } },
      branch: { select: { id: true, code: true, name: true } },
    },
    orderBy: [
      { status: 'asc' },
      { queueNumber: 'asc' },
    ],
  });

  return NextResponse.json({ queue });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    requireRole(user, [Role.RECEPTIONIST, Role.BRANCH_MANAGER, Role.OWNER_ADMIN]);

    const body = await req.json();
    const { patientId, branchId, dentistUserId, priorityReason } = body;

    const queueEntry = await admitDirectWalkIn(
      patientId,
      branchId,
      dentistUserId,
      priorityReason,
      { id: user.id, role: user.roleGrants[0]?.role }
    );

    return NextResponse.json({ queueEntry }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Walk-in admission failed' }, { status: 400 });
  }
}
