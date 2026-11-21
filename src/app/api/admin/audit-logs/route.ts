import {getOperationalUser} from '@/lib/operational-auth';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { hasRole } from '@/lib/rbac';
import { Role } from '@prisma/client';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
  const user = await getOperationalUser();
  if (!user || !hasRole(user, [Role.OWNER_ADMIN, Role.SYSTEM_ADMIN])) {
    return NextResponse.json({ error: 'Unauthorized: Clinic Owner / System Admin required' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');
  const entityType = searchParams.get('entityType');
  const limit = parseInt(searchParams.get('limit') || '100', 10);

  try {
    const [events, totalCount] = await Promise.all([
      db.auditEvent.findMany({
        where: {
          ...(action ? { action } : {}),
          ...(entityType ? { entityType } : {}),
        },
        include: {
          actorUser: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          branch: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: Math.min(limit, 200),
      }),
      db.auditEvent.count(),
    ]);

    return NextResponse.json({ events, totalCount });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to query audit logs' }, { status: 400 });
  }
}
