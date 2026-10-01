import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/session';

const COLD_START_TIMEOUTS_MS = [65_000, 15_000] as const;

function serviceUnavailable() {
  return NextResponse.json(
    {
      message:
        'The school service is waking up. Please wait a moment and try again.',
    },
    { status: 503 },
  );
}

async function waitForBackend(apiUrl: string) {
  for (const timeout of COLD_START_TIMEOUTS_MS) {
    try {
      const response = await fetch(`${apiUrl}/health`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(timeout),
      });
      if (response.ok) {
        const health = (await response.json().catch(() => null)) as { status?: string } | null;
        if (health?.status === 'ok') return true;
      }
    } catch {
      // A free Render instance can reset the first request while it wakes.
    }
  }
  return false;
}

async function proxy(request: NextRequest, path: string[]) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const apiUrl = process.env.API_URL?.replace(/\/$/, '');
  if (!apiUrl) return serviceUnavailable();

  // Wake the backend before sending a non-idempotent request. This avoids
  // retrying a POST/PATCH/PUT after an ambiguous gateway failure.
  if (!['GET', 'HEAD'].includes(request.method)) {
    const ready = await waitForBackend(apiUrl);
    if (!ready) return serviceUnavailable();
  }

  const targetUrl = new URL(`${apiUrl}/${path.join('/')}`);
  targetUrl.search = request.nextUrl.search;

  const headers: HeadersInit = { 'User-Agent': request.headers.get('user-agent') ?? '' };
  const incomingContentType = request.headers.get('content-type');
  if (incomingContentType) {
    headers['Content-Type'] = incomingContentType;
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const hasBody = !['GET', 'HEAD', 'DELETE'].includes(request.method);
  const body = hasBody ? await request.arrayBuffer() : undefined;

  let backendResponse: Response;
  try {
    backendResponse = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
      cache: 'no-store',
      signal: AbortSignal.timeout(70_000),
    });
  } catch {
    return serviceUnavailable();
  }

  if ([502, 503, 504].includes(backendResponse.status)) {
    return serviceUnavailable();
  }

  const responseBuffer = await backendResponse.arrayBuffer();
  const contentType = backendResponse.headers.get('content-type') ?? 'application/json';

  return new NextResponse(responseBuffer, {
    status: backendResponse.status,
    headers: { 'content-type': contentType },
  });
}

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, context: RouteContext) {
  return proxy(request, (await context.params).path);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxy(request, (await context.params).path);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return proxy(request, (await context.params).path);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return proxy(request, (await context.params).path);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return proxy(request, (await context.params).path);
}
