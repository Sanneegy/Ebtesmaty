import { NextResponse } from 'next/server';
import { presentationAccounts, presentationEnabled } from '@/lib/presentation';
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from '@/lib/auth';

function handleDemoSwitch(accountEmail: string | null, requestUrl: string) {
  const url = new URL(requestUrl);
  const account = presentationAccounts.find((a) => a.email === accountEmail);

  if (!account) {
    return NextResponse.redirect(new URL('/auth/login', url.origin), 303);
  }

  const destination = account.path || '/patient/dashboard';
  const targetUrl = new URL(destination, url.origin);
  const response = NextResponse.redirect(targetUrl, 303);
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  response.cookies.set(SESSION_COOKIE_NAME, `demo:${account.email}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  });

  return response;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const email = url.searchParams.get('email');
    if (email) {
      return handleDemoSwitch(email, request.url);
    }
    return NextResponse.redirect(new URL('/auth/login', url.origin), 303);
  } catch (err) {
    const url = new URL(request.url);
    return NextResponse.redirect(new URL('/auth/login', url.origin), 303);
  }
}

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);

    if (!presentationEnabled()) {
      return NextResponse.json({ error: 'Presentation access is disabled' }, { status: 403 });
    }

    let email: string | null = null;
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await request.json().catch(() => ({}));
      email = body?.email || null;
    } else {
      const form = await request.formData().catch(() => null);
      email = form?.get('email')?.toString() || null;
    }

    if (!email) {
      email = url.searchParams.get('email');
    }

    return handleDemoSwitch(email, request.url);
  } catch (err: any) {
    console.error('Demo switch error:', err);
    const url = new URL(request.url);
    return NextResponse.redirect(new URL('/auth/login', url.origin), 303);
  }
}
