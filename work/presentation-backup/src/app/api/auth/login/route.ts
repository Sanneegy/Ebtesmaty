import { NextResponse } from 'next/server';
import db from '../../../../lib/db';
import { verifyPassword, createSession, setSessionCookie } from '../../../../lib/auth';
import { logAuditEvent } from '../../../../lib/audit';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { emailOrPhone, password } = body;

    if (!emailOrPhone || !password) {
      return NextResponse.json({ error: 'Email/phone and password are required' }, { status: 400 });
    }

    const user = await db.user.findFirst({
      where: {
        OR: [{ email: emailOrPhone.trim().toLowerCase() }, { phone: emailOrPhone.trim() }],
      },
      include: {
        roleGrants: true,
      },
    });

    if (!user || user.status !== "ACTIVE") {
      return NextResponse.json({ error: 'Invalid email, phone, or password' }, { status: 401 });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid email, phone, or password' }, { status: 401 });
    }

    // Create session
    const { token, expiresAt } = await createSession(user.id);
    await setSessionCookie(token, expiresAt);

    await logAuditEvent({
      actorUserId: user.id,
      actorRole: user.roleGrants[0]?.role ?? 'USER',
      action: 'USER_LOGIN',
      entityType: 'User',
      entityId: user.id,
      metadata: { method: 'PASSWORD' },
    });

    const primaryRole = user.roleGrants[0]?.role;
    let redirectUrl = '/portal';
    if (primaryRole === 'FINANCE') redirectUrl = '/billing';
    else if (primaryRole === 'INVENTORY') redirectUrl = '/inventory';
    else if (primaryRole === 'CRM') redirectUrl = '/crm';
    else if (primaryRole === 'RECEPTIONIST') redirectUrl = '/reception';
    else if (primaryRole === 'DENTIST') redirectUrl = '/dentist';
    else if (primaryRole === 'BRANCH_MANAGER' || primaryRole === 'OWNER_ADMIN') redirectUrl = '/management';

    return NextResponse.json({ success: true, redirectUrl, user: { id: user.id, fullName: user.fullName, role: primaryRole } });
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
