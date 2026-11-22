import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { Role } from '@/lib/prisma-shim';
import { getOperationalAlerts } from '@/services/communications.service';

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const branchId = searchParams.get('branchId') || undefined;

  try {
    const alerts = await getOperationalAlerts(branchId);
    return NextResponse.json({ alerts });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch operational alerts' }, { status: 400 });
  }
}
