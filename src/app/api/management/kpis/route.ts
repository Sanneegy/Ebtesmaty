import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { Role } from '@prisma/client';
import { getManagementActionCenterKPIs } from '@/services/communications.service';

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const allowed = user.roleGrants.some((g) =>
    ([Role.OWNER_ADMIN, Role.BRANCH_MANAGER] as Role[]).includes(g.role)
  );

  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden: Executive management authority required' }, { status: 403 });
  }

  try {
    const kpis = await getManagementActionCenterKPIs();
    return NextResponse.json(kpis);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch management KPIs' }, { status: 400 });
  }
}
