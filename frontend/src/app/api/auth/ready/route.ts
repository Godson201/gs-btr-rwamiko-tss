import { NextResponse } from 'next/server';

export async function GET() {
  const apiUrl = process.env.API_URL?.trim().replace(/\/$/, '');
  if (!apiUrl) {
    return NextResponse.json({ message: 'The login service is not configured. Please contact the school administrator.' }, { status: 500 });
  }
  try {
    const response = await fetch(`${apiUrl}/health`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });
    const health = await response.json();
    if (response.ok && health?.status === 'ok') {
      return NextResponse.json({ ready: true }, { headers: { 'Cache-Control': 'no-store' } });
    }
  } catch {
    // Readiness requests are safe to repeat while the server starts.
  }
  return NextResponse.json({ ready: false }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
}
