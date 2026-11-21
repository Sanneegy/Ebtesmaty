import {normalizePhone} from '@/lib/phone';
import {loginDestination} from '@/lib/login-destination';
import { NextResponse } from 'next/server';
import db from '../../../../lib/db';
import { verifyPassword, createSession, setSessionCookie } from '../../../../lib/auth';
import { logAuditEvent } from '../../../../lib/audit';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { emailOrPhone, password } = body;

    if (typeof emailOrPhone !== 'string' || typeof password !== 'string' || !emailOrPhone || !password || password.length>256) {
      return NextResponse.json({ error: 'Email/phone and password are required' }, { status: 400 });
    }

    const user = await db.user.findFirst({
      where: {
        OR: [{ email: emailOrPhone.trim().toLowerCase() }, { phone: normalizePhone(emailOrPhone) }],
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

    const redirectUrl=loginDestination(user.roleGrants);
    if(!redirectUrl)return NextResponse.json({error:'No authorized workspace is configured'},{status:403});
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
    return NextResponse.json({ success: true, redirectUrl, user: { id: user.id, fullName: user.fullName, role: primaryRole } });
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Could not sign in. Please try again.' }, { status: 500 });
  }
}
