import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from '@/lib/session';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body?.email || !body?.password) {
    return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
  }

  let backendResponse: Response;
  try {
    backendResponse = await fetch(`${process.env.API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': request.headers.get('user-agent') ?? '' },
      body: JSON.stringify({ email: body.email, password: body.password }),
    });
  } catch {
    return NextResponse.json(
      { message: 'The login service is temporarily unavailable. Please try again shortly.' },
      { status: 503 },
    );
  }

  const responseText = await backendResponse.text();
  let data: Record<string, unknown> | null = null;
  if (responseText) {
    try {
      data = JSON.parse(responseText) as Record<string, unknown>;
    } catch {
      data = null;
    }
  }

  if (!backendResponse.ok) {
    return NextResponse.json(data ?? { message: 'Login failed' }, { status: backendResponse.status });
  }

  if (!data?.user || typeof data.accessToken !== 'string') {
    return NextResponse.json(
      { message: 'The login service returned an invalid response. Please try again shortly.' },
      { status: 502 },
    );
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
