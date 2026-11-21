import {getOperationalUser} from '@/lib/operational-auth';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../lib/auth';
import db from '../../../../lib/db';

export async function GET() {
  try {
    const user = await getOperationalUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const link = await db.portalPatientLink.findFirst({
      where: { userId: user.id, status: 'APPROVED' },
      include: { patient: true },
    });

    if (!link) {
      return NextResponse.json({ patient: null, draft: null });
    }

    const draft = await db.medicalHistorySubmission.findFirst({
      where: { patientId: link.patientId, status: 'DRAFT' },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ patient: link.patient, draft });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
