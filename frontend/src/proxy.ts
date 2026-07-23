import { jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';
import { roleHomePath, SESSION_COOKIE, type SessionPayload } from '@/lib/session';

const PROTECTED_PREFIXES: Record<string, SessionPayload['role'][]> = {
  '/admin': ['ADMIN', 'SUPER_ADMIN'],
  '/teacher': ['TEACHER'],
  '/student': ['STUDENT'],
  '/parent': ['PARENT'],
};

async function getSession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await getSession(token);

  const matchedPrefix = Object.keys(PROTECTED_PREFIXES).find((prefix) =>
    pathname.startsWith(prefix),
  );

  if (matchedPrefix) {
    if (!session) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (!PROTECTED_PREFIXES[matchedPrefix].includes(session.role)) {
      return NextResponse.redirect(new URL(roleHomePath(session.role), request.url));
    }
  }

  if ((pathname === '/auth/login' || pathname === '/auth/signup') && session) {
    return NextResponse.redirect(new URL(roleHomePath(session.role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/teacher/:path*',
    '/student/:path*',
    '/parent/:path*',
    '/auth/login',
    '/auth/signup',
  ],
};
