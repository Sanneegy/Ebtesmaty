import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { reportPatientArrival } from '@/services/scheduling.service';
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
  const onlyUnverified = searchParams.get('unverified') === 'true';

  const { start, end } = getCairoDayBounds();
  const whereClause: any = { reportedAt: { gte: start, lt: end } };
  const isStaff = hasRole(user, [Role.RECEPTIONIST, Role.BRANCH_MANAGER, Role.OWNER_ADMIN]);
  if (isStaff) {
    if (branchId && !hasRole(user, [Role.RECEPTIONIST, Role.BRANCH_MANAGER, Role.OWNER_ADMIN], branchId)) {
      return NextResponse.json({ error: 'Forbidden branch' }, { status: 403 });
    }
    const allowed = user.roleGrants.filter(g => g.role !== Role.PATIENT).map(g => g.branchId);
    if (branchId) whereClause.branchId = branchId;
    else if (!allowed.includes(null)) whereClause.branchId = { in: allowed.filter((id): id is string => !!id) };
  } else {
    const links = await db.portalPatientLink.findMany({
      where: { userId: user.id, status: 'APPROVED' }, select: { patientId: true },
    });
    whereClause.patientId = { in: links.map(l => l.patientId) };
    if (branchId) whereClause.branchId = branchId;
  }
  if (onlyUnverified) whereClause.isVerified = false;

  const arrivals = await db.arrivalEvent.findMany({
    where: whereClause,
    include: {
      patient: { select: { id: true, patientNumber: true, fullName: true, primaryPhone: true } },
      appointment: { select: { id: true, appointmentDate: true, startTime: true, serviceDescription: true } },
      branch: { select: { id: true, code: true, name: true } },
    },
    orderBy: { reportedAt: 'desc' },
    take: 50,
  });

  return NextResponse.json({ arrivals });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { patientId, branchId, appointmentId } = body;

    const isStaff = user.roleGrants.some((g) =>
      ([Role.RECEPTIONIST, Role.BRANCH_MANAGER, Role.OWNER_ADMIN] as Role[]).includes(g.role)
    );
    if (!isStaff) {
      const link = await db.portalPatientLink.findFirst({
        where: { userId: user.id, patientId, status: 'APPROVED' },
      });
      if (!link) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const arrival = await reportPatientArrival(patientId, branchId, appointmentId);
    return NextResponse.json({ arrival }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to report arrival' }, { status: 400 });
  }
}
