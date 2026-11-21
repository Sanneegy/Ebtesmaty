import {getOperationalUser} from '@/lib/operational-auth';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../lib/auth';
import { saveIntakeDraft } from '../../../../services/intake.service';

export async function POST(request: Request) {
  try {
    const user = await getOperationalUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { patientId, answers } = body;

    if (!patientId || !answers) {
      return NextResponse.json({ error: 'patientId and answers are required' }, { status: 400 });
    }

    const draft = await saveIntakeDraft(patientId, answers, user.id);
    return NextResponse.json({ success: true, draft });
  } catch (err: any) {
    console.error('Save draft error:', err);
    return NextResponse.json({ error: err.message || 'Failed to save draft' }, { status: err.statusCode || 500 });
  }
}
