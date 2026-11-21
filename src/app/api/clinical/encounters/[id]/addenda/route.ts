import {getOperationalUser} from '@/lib/operational-auth';
import db from '@/lib/db';
import {requireClinicalAccess} from '@/lib/rbac';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { requireRole } from '@/lib/rbac';
import { Role } from '@prisma/client';
import { addClinicalAddendum } from '@/services/clinical.service';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getOperationalUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const record=await db.encounter.findUniqueOrThrow({where:{id:params.id}});
    await requireClinicalAccess(user,record.patientId);
    requireRole(user, [Role.DENTIST, Role.OWNER_ADMIN]);
    const body = await req.json();
    const { addendumText } = body;

    if (!addendumText || !addendumText.trim()) {
      return NextResponse.json({ error: 'Addendum text is required' }, { status: 400 });
    }

    const addendum = await addClinicalAddendum(params.id, user.id, addendumText);
    return NextResponse.json({ addendum }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to add addendum' }, { status: 400 });
  }
}
