import { NextRequest, NextResponse } from 'next/server';
import { proxyMedia } from '@/lib/media-proxy';

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  if (!path.length || path.some(part => !/^[a-zA-Z0-9_-][a-zA-Z0-9_.-]*$/.test(part))) {
    return NextResponse.json({ message: 'Media not found' }, { status: 404 });
  }
  return proxyMedia(request, new URL(`/uploads/${path.join('/')}`, process.env.API_URL));
}
