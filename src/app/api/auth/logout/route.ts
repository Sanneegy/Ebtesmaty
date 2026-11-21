import { NextResponse } from 'next/server';
import { clearSessionCookie } from '../../../../lib/auth';

export async function POST(request: Request) {
  await clearSessionCookie();
  return NextResponse.redirect(new URL('/auth/login', request.url), 303);
}

export async function GET(request: Request) {
  await clearSessionCookie();
  return NextResponse.redirect(new URL('/auth/login', request.url), 303);
}
