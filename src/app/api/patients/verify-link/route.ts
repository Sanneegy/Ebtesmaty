import {getOperationalUser} from '@/lib/operational-auth';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../lib/auth';
import { verifyPortalPatientLink } from '../../../../services/patient.service';

export async function POST(request: Request) {
  try {
    const user = await getOperationalUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { linkId, decision, verificationNotes } = body;

    if (!linkId || !decision) {
      return NextResponse.json({ error: 'linkId and decision are required' }, { status: 400 });
    }

    const updated = await verifyPortalPatientLink(
      linkId,
      decision,
      verificationNotes || 'Verified by reception staff',
      user
    );

    return NextResponse.json({ success: true, link: updated });
  } catch (err: any) {
    console.error('Verify link error:', err);
    return NextResponse.json({ error: err.message }, { status: err.statusCode || 500 });
  }
}
