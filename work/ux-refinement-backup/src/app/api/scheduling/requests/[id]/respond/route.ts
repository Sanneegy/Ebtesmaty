import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { patientRespondToAlternative } from '@/services/scheduling.service';
import { Role } from '@prisma/client';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { response, dentistUserId } = body;

    const request = await db.appointmentRequest.findUnique({
      where: { id: params.id },
      include: { branch: true },
    });

    if (!request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const link = await db.portalPatientLink.findFirst({
      where: { userId: user.id, patientId: request.patientId, status: 'APPROVED' },
    });

    const isStaff = user.roleGrants.some((g) => ([Role.RECEPTIONIST, Role.OWNER_ADMIN] as Role[]).includes(g.role));
    if (!link && !isStaff) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const targetDentist = dentistUserId || request.dentistPreferenceId;
    if (!targetDentist && response === 'ACCEPT') {
      const dentistGrant = await db.roleGrant.findFirst({
        where: { branchId: request.branchId, role: 'DENTIST' },
      });
      if (!dentistGrant) {
        throw new Error('No dentist available for this branch.');
      }
      const result = await patientRespondToAlternative(
        params.id,
        response,
        dentistGrant.userId,
        { id: user.id, role: user.roleGrants[0]?.role }
      );
      return NextResponse.json(result);
    }

    const result = await patientRespondToAlternative(
      params.id,
      response,
      targetDentist || '',
      { id: user.id, role: user.roleGrants[0]?.role }
    );

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Response failed' }, { status: 400 });
  }
}
