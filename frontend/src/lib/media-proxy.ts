import { NextRequest, NextResponse } from 'next/server';

// Stream range requests rather than buffering whole videos in server memory.
export async function proxyMedia(request: NextRequest, target: URL, authorization?: string) {
  try {
    const headers = new Headers();
    // Keep byte offsets and lengths consistent with the body streamed to browsers.
    headers.set('Accept-Encoding', 'identity');
    if (authorization) headers.set('Authorization', authorization);
    for (const name of ['range', 'if-range']) {
      const value = request.headers.get(name);
      if (value) headers.set(name, value);
    }
    const upstream = await fetch(target, { headers, cache: 'no-store', signal: request.signal });
    const output = new Headers({ 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    for (const name of ['content-type', 'content-length', 'content-range', 'accept-ranges', 'etag', 'last-modified']) {
      // fetch decodes compressed responses, so their wire length is no longer valid.
      if (name === 'content-length' && upstream.headers.get('content-encoding') && upstream.headers.get('content-encoding') !== 'identity') continue;
      const value = upstream.headers.get(name);
      if (value) output.set(name, value);
    }
    return new NextResponse(upstream.body, { status: upstream.status, headers: output });
  } catch {
    return NextResponse.json({ message: 'Media is temporarily unavailable' }, { status: 503 });
  }
}
