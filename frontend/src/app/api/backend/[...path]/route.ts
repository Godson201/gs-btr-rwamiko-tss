import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/session';

async function proxy(request: NextRequest, path: string[]) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  const targetUrl = new URL(`${process.env.API_URL}/${path.join('/')}`);
  targetUrl.search = request.nextUrl.search;

  const headers: HeadersInit = {};
  const incomingContentType = request.headers.get('content-type');
  if (incomingContentType) {
    headers['Content-Type'] = incomingContentType;
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const hasBody = !['GET', 'HEAD', 'DELETE'].includes(request.method);
  const body = hasBody ? await request.arrayBuffer() : undefined;

  const backendResponse = await fetch(targetUrl, {
    method: request.method,
    headers,
    body,
    cache: 'no-store',
  });

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
