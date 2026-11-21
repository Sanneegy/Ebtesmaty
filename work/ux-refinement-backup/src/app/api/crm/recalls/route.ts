import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';
import { logAuditEvent } from '@/lib/audit';
import { FollowUpStatus, Role } from '@prisma/client';

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const allowed = user.roleGrants.some((g) =>
    ([Role.OWNER_ADMIN, Role.BRANCH_MANAGER, Role.RECEPTIONIST, Role.DENTIST] as Role[]).includes(
      g.role
    )
  );
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { followUpId, status, outcomeNote } = body;

    if (!followUpId || !status) {
      return NextResponse.json({ error: 'followUpId and status are required' }, { status: 400 });
    }

    const existing = await db.followUp.findUnique({ where: { id: followUpId } });
    if (!existing) {
      return NextResponse.json({ error: 'FollowUp record not found' }, { status: 404 });
    }

    const updatedNotes = outcomeNote
      ? `${existing.notes || ''} | [CRM Note by ${user.fullName}: ${outcomeNote}]`.trim()
      : existing.notes;

    const updated = await db.followUp.update({
      where: { id: followUpId },
      data: {
        status: status as FollowUpStatus,
        notes: updatedNotes,
      },
      include: {
        patient: { select: { id: true, fullName: true, patientNumber: true, primaryPhone: true } },
        branch: { select: { id: true, code: true, name: true } },
      },
    });

    await logAuditEvent({
      actorUserId: user.id,
      action: 'CRM_RECALL_STATUS_UPDATED',
      entityType: 'FollowUp',
      entityId: followUpId,
      metadata: { status, outcomeNote },
    });

    return NextResponse.json({ followUp: updated });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to update recall status' },
      { status: 400 }
    );
  }
}
