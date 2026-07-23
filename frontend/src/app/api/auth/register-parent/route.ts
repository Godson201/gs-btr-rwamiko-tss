import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from '@/lib/session';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body?.email || !body?.password || !body?.firstName || !body?.lastName) {
    return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
  }

  const backendResponse = await fetch(`${process.env.API_URL}/auth/register-parent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: body.email,
      password: body.password,
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone,
    }),
  });

  const data = await backendResponse.json().catch(() => null);

  if (!backendResponse.ok) {
    return NextResponse.json(data ?? { message: 'Registration failed' }, {
      status: backendResponse.status,
    });
  }

  const response = NextResponse.json({ user: data.user });
  response.cookies.set(SESSION_COOKIE, data.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return response;
}
