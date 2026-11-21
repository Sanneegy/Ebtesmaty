import { NextResponse } from 'next/server';
import db from '../../../../lib/db';
import { createSession, setSessionCookie } from '../../../../lib/auth';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const email = formData.get('email') as string;
    const requestedRedirect = formData.get('redirectTo') as string | null;

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { email },
      include: { roleGrants: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Demo user not found' }, { status: 404 });
    }

    const { token, expiresAt } = await createSession(user.id);
    await setSessionCookie(token, expiresAt);

    const primaryRole = user.roleGrants[0]?.role;
    let redirectUrl = '/portal';
    if (requestedRedirect && requestedRedirect.startsWith('/')) {
      redirectUrl = requestedRedirect;
    } else if (primaryRole === 'RECEPTIONIST') {
      redirectUrl = '/reception';
    } else if (primaryRole === 'DENTIST') {
      redirectUrl = '/dentist';
    } else if (primaryRole === 'BRANCH_MANAGER' || primaryRole === 'OWNER_ADMIN') {
      redirectUrl = '/management';
    }

    return NextResponse.redirect(new URL(redirectUrl, request.url), 303);
  } catch (err: any) {
    console.error('Demo switch error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
