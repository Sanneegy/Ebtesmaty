import {getOperationalUser} from '@/lib/operational-auth';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { Role } from '@/lib/prisma-shim';
import { verifyAndReturnToService } from '@/services/equipment.service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getOperationalUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verification requires Branch Manager or Owner Admin authority
  const allowed = user.roleGrants.some((g) =>
    ([Role.OWNER_ADMIN, Role.BRANCH_MANAGER] as Role[]).includes(g.role)
  );

  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden: Management authority required to return equipment to service' }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const updated = await verifyAndReturnToService(id, user.id, body.notes);
    return NextResponse.json({ success: true, workOrder: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to verify work order' }, { status: 400 });
  }
}
