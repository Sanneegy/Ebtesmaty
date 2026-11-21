import {getOperationalUser} from '@/lib/operational-auth';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getServiceCatalog } from '@/services/billing.service';

export async function GET(req: NextRequest) {
  const user = await getOperationalUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const catalog = await getServiceCatalog();
    return NextResponse.json({ catalog });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch catalog' }, { status: 400 });
  }
}
