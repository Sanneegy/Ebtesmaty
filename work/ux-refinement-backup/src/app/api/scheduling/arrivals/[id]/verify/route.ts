import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { requireRole } from '@/lib/rbac';
import { verifyArrivalAndAdmitToQueue } from '@/services/scheduling.service';
import { Role } from '@prisma/client';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    requireRole(user, [Role.RECEPTIONIST, Role.BRANCH_MANAGER, Role.OWNER_ADMIN]);

    const result = await verifyArrivalAndAdmitToQueue(params.id, {
      id: user.id,
      role: user.roleGrants[0]?.role,
      branchId: user.roleGrants[0]?.branchId || undefined,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    const status = error.statusCode || 400;
    return NextResponse.json({ error: error.message || 'Verification failed' }, { status });
  }
}
