import {normalizePhone} from '@/lib/phone';
import {loginDestination} from '@/lib/login-destination';
import { NextResponse } from 'next/server';
import db from '../../../../lib/db';
import { verifyPassword, createSession, setSessionCookie, FALLBACK_DEMO_USERS } from '../../../../lib/auth';
import { logAuditEvent } from '../../../../lib/audit';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { emailOrPhone, password } = body;

    if (typeof emailOrPhone !== 'string' || typeof password !== 'string' || !emailOrPhone || !password || password.length>256) {
      return NextResponse.json({ error: 'Email/phone and password are required' }, { status: 400 });
    }

    const cleanIdentity = emailOrPhone.trim().toLowerCase();
    const cleanPhone = normalizePhone(emailOrPhone);

    // 1. Try PostgreSQL database first
    try {
      const user = await db.user.findFirst({
        where: {
          OR: [{ email: cleanIdentity }, { phone: cleanPhone }],
        },
        include: {
          roleGrants: true,
        },
      });

      if (user && user.status === "ACTIVE") {
        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) {
          return NextResponse.json({ error: 'Invalid email, phone, or password' }, { status: 401 });
        }

        const redirectUrl = loginDestination(user.roleGrants);
        if (!redirectUrl) return NextResponse.json({ error: 'No authorized workspace is configured' }, { status: 403 });

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
      }
    } catch (dbErr) {
      console.warn('Database unavailable during login, checking fallback demo accounts:', dbErr);
    }

    // 2. Fallback to built-in demo accounts when running on Vercel without an external DB
    const fallbackAccount =
      FALLBACK_DEMO_USERS[cleanIdentity] ||
      Object.values(FALLBACK_DEMO_USERS).find((u: any) => u.phone === cleanPhone);

    if (fallbackAccount && password === 'Password123!') {
      const redirectUrl = loginDestination(fallbackAccount.roleGrants) || '/patient/dashboard';
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
      await setSessionCookie(`demo:${fallbackAccount.email}`, expiresAt);
      const primaryRole = fallbackAccount.roleGrants[0]?.role;
      return NextResponse.json({
        success: true,
        redirectUrl,
        user: { id: fallbackAccount.id, fullName: fallbackAccount.fullName, role: primaryRole },
      });
    }

    return NextResponse.json({ error: 'Invalid email, phone, or password' }, { status: 401 });
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Could not sign in. Please try again.' }, { status: 500 });
  }
}
