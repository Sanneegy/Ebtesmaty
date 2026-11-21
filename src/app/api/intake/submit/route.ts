import {getOperationalUser} from '@/lib/operational-auth';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../lib/auth';
import { submitIntake } from '../../../../services/intake.service';

export async function POST(request: Request) {
  try {
    const user = await getOperationalUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { patientId, answers, isAssistedByReception } = body;

    if (!patientId || !answers) {
      return NextResponse.json({ error: 'patientId and answers are required' }, { status: 400 });
    }

    const submission = await submitIntake(
      patientId,
      answers,
      user,
      Boolean(isAssistedByReception)
    );

    return NextResponse.json({ success: true, submission });
  } catch (err: any) {
    console.error('Submit intake error:', err);
    return NextResponse.json({ error: err.message || 'Failed to submit intake' }, { status: err.statusCode || 500 });
  }
}
