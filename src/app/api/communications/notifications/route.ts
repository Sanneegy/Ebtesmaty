import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getUserNotifications } from '@/services/communications.service';

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const notifications = await getUserNotifications(user.id);
    return NextResponse.json({ notifications });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch notifications' }, { status: 400 });
  }
}
