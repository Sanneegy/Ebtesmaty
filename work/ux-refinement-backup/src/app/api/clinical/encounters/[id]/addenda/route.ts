import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { requireRole } from '@/lib/rbac';
import { Role } from '@prisma/client';
import { addClinicalAddendum } from '@/services/clinical.service';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
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
