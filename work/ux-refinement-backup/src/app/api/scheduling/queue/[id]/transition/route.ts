import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { requireRole } from '@/lib/rbac';
import { callQueuePatient, startConsultation, completeConsultation } from '@/services/scheduling.service';
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
    requireRole(user, [Role.RECEPTIONIST, Role.DENTIST, Role.BRANCH_MANAGER, Role.OWNER_ADMIN]);

    const body = await req.json();
    const { action } = body;

    let result;
    if (action === 'CALL') {
      result = await callQueuePatient(params.id, { id: user.id, role: user.roleGrants[0]?.role });
    } else if (action === 'START') {
      result = await startConsultation(params.id, { id: user.id, role: user.roleGrants[0]?.role });
    } else if (action === 'COMPLETE') {
      result = await completeConsultation(params.id, { id: user.id, role: user.roleGrants[0]?.role });
    } else {
      return NextResponse.json({ error: 'Invalid queue transition action' }, { status: 400 });
    }

    return NextResponse.json({ queueEntry: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Queue transition failed' }, { status: 400 });
  }
}
