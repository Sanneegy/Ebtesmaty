import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { hasRole } from '@/lib/rbac';
import { Role } from '@prisma/client';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user, [Role.OWNER_ADMIN])) {
    return NextResponse.json({ error: 'Unauthorized: Clinic Owner / System Admin required' }, { status: 403 });
  }

  try {
    const users = await db.user.findMany({
      include: {
        roleGrants: {
          include: {
            branch: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
        staffProfile: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ users });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to query users' }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user, [Role.OWNER_ADMIN])) {
    return NextResponse.json({ error: 'Unauthorized: Clinic Owner / System Admin required' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { userId, role, branchId } = body;

    if (!userId || !role) {
      return NextResponse.json({ error: 'Missing userId or role' }, { status: 400 });
    }

    // Create role grant
    const grant = await db.roleGrant.create({
      data: {
        userId,
        role: role as Role,
        branchId: branchId || null,
        grantedBy: user.id,
      },
      include: {
        branch: true,
      },
    });

    // Record audit event
    await db.auditEvent.create({
      data: {
        actorUserId: user.id,
        actorRole: 'OWNER_ADMIN',
        action: 'ROLE_GRANTED',
        entityType: 'RoleGrant',
        entityId: grant.id,
        metadataJson: { targetUserId: userId, role, branchId },
      },
    });

    return NextResponse.json({ success: true, grant }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to grant role' }, { status: 400 });
  }
}
