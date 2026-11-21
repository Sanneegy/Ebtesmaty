import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../lib/auth';
import { reviewIntake } from '../../../../services/intake.service';
import { ReviewOutcome } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { submissionId, outcome, clinicalNotes } = body;

    if (!submissionId || !outcome || !clinicalNotes) {
      return NextResponse.json({ error: 'submissionId, outcome, and clinicalNotes are required' }, { status: 400 });
    }

    if (outcome !== ReviewOutcome.APPROVED && outcome !== ReviewOutcome.CLARIFICATION_REQUESTED) {
      return NextResponse.json({ error: 'Invalid review outcome' }, { status: 400 });
    }

    const review = await reviewIntake(
      submissionId,
      outcome,
      clinicalNotes,
      user
    );

    return NextResponse.json({ success: true, review });
  } catch (err: any) {
    console.error('Review intake error:', err);
    return NextResponse.json({ error: err.message || 'Failed to review intake' }, { status: err.statusCode || 500 });
  }
}
