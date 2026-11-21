import {loginDestination} from '@/lib/login-destination';
import {logAuditEvent} from '@/lib/audit';
import {NextResponse} from 'next/server';
import db from '@/lib/db';
import {createSession,setSessionCookie} from '@/lib/auth';
import {presentationAccounts,presentationEnabled} from '@/lib/presentation';
export async function POST(request:Request) {
  try {
    const url = new URL(request.url);
    console.log('demo-switch request url:', url.href);
    console.log('demo-switch origin header:', request.headers.get('origin'));
    console.log('demo-switch x-forwarded-host:', request.headers.get('x-forwarded-host'));
    console.log('demo-switch x-forwarded-proto:', request.headers.get('x-forwarded-proto'));

    if (!presentationEnabled()) {
      return NextResponse.json({ error: 'Presentation access is disabled' }, { status: 404 });
    }

    const form = await request.formData();
    const email = form.get('email');
    const account = presentationAccounts.find((a) => a.email === email);
    if (!account) {
      return NextResponse.json({ error: 'Choose a presentation account' }, { status: 400 });
    }

    // Try finding user in PostgreSQL, fallback to stateless cookie token if DB is unreachable (e.g. Vercel serverless without DB)
    let destination: string = account.path;
    let sessionCreated = false;
    try {
      const user = await db.user.findUnique({
        where: { email: account.email },
        include: { roleGrants: true },
      });

      if (user && user.status === 'ACTIVE') {
        const computedDest = loginDestination(user.roleGrants);
        if (computedDest) destination = computedDest;
        const { token, expiresAt } = await createSession(user.id);
        await setSessionCookie(token, expiresAt);
        sessionCreated = true;
        await logAuditEvent({
          actorUserId: user.id,
          actorRole: user.roleGrants[0]?.role,
          action: 'USER_LOGIN',
          entityType: 'User',
          entityId: user.id,
          metadata: { method: 'LOCAL_PRESENTATION' },
        });
      }
    } catch (dbErr) {
      console.warn('Database session creation skipped or failed, using stateless demo token:', dbErr);
    }

    if (!sessionCreated) {
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
      await setSessionCookie(`demo:${account.email}`, expiresAt);
    }

    // Determine redirect base URL safely supporting Vercel and reverse proxies
    const forwardedHost = request.headers.get('x-forwarded-host');
    const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
    const baseUrl = forwardedHost ? `${forwardedProto}://${forwardedHost}` : url.origin;

    return NextResponse.redirect(new URL(destination, baseUrl), 303);
  } catch (err: any) {
    console.error('Demo switch general error:', err);
    return NextResponse.json({ error: 'Failed to switch demo account' }, { status: 500 });
  }
}

