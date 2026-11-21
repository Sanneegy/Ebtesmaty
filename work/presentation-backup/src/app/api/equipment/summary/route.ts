import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getEquipmentSummary } from '@/services/equipment.service';

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const branchId = searchParams.get('branchId') || undefined;

  try {
    const summary = await getEquipmentSummary(branchId);
    return NextResponse.json({ summary });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch equipment summary' }, { status: 400 });
  }
}
