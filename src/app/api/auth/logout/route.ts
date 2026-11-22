import { NextResponse } from 'next/server';
import { clearSessionCookie, SESSION_COOKIE_NAME } from '@/lib/auth';

function doLogout(request: Request) {
  const url = new URL(request.url);
  const response = NextResponse.redirect(new URL('/auth/login', url.origin), 303);
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}

export async function POST(request: Request) {
  await clearSessionCookie().catch(() => {});
  return doLogout(request);
}

export async function GET(request: Request) {
  await clearSessionCookie().catch(() => {});
  return doLogout(request);
}
