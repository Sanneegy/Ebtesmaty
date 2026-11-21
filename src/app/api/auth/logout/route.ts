import { NextResponse } from 'next/server';
import { clearSessionCookie } from '../../../../lib/auth';

function getBaseUrl(request: Request) {
  const url = new URL(request.url);
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  return forwardedHost ? `${forwardedProto}://${forwardedHost}` : url.origin;
}

export async function POST(request: Request) {
  await clearSessionCookie();
  return NextResponse.redirect(new URL('/auth/login', getBaseUrl(request)), 303);
}

export async function GET(request: Request) {
  await clearSessionCookie();
  return NextResponse.redirect(new URL('/auth/login', getBaseUrl(request)), 303);
}
