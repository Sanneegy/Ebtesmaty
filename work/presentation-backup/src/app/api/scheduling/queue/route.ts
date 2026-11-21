import { orderVisits } from '@/lib/scheduling-rules';
import { getQueuePolicy } from '@/services/visit.service';
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

        },
      },
      appointment: { select: { dentistUser:{select:{fullName:true}}, id: true, appointmentDate: true, startTime: true, serviceDescription: true } },
      branch: { select: { id: true, code: true, name: true } },
    },
    orderBy: [
      { status: 'asc' },
      { queueNumber: 'asc' },
    ],
  });

  const grouped = new Map<string, typeof queue>();
  for(const entry of queue) grouped.set(entry.branchId,[...(grouped.get(entry.branchId)||[]),entry]);
  const ordered=[];
  for(const [id,entries] of grouped) ordered.push(...orderVisits(entries,await getQueuePolicy(id)));
  return NextResponse.json({ queue:ordered });
}

export async function POST(){return NextResponse.json({error:'Create a walk-in booking in an available slot, then check in at reception.'},{status:409});}
