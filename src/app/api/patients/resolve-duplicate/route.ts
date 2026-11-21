import {getOperationalUser} from '@/lib/operational-auth';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../lib/auth';
import { resolveDuplicateReview } from '../../../../services/patient.service';
import { DuplicateReviewStatus } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const user = await getOperationalUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { reviewId, resolution, resolutionNotes } = body;

    if (!reviewId || !resolution) {
      return NextResponse.json({ error: 'reviewId and resolution are required' }, { status: 400 });
    }

    const review = await resolveDuplicateReview(
      reviewId,
      resolution as DuplicateReviewStatus,
      resolutionNotes || 'Reviewed by authorized clinic staff',
      user
    );

    return NextResponse.json({ success: true, review });
  } catch (err: any) {
    console.error('Resolve duplicate error:', err);
    return NextResponse.json({ error: err.message }, { status: err.statusCode || 500 });
  }
}
