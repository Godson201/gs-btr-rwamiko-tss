import { Request, Response } from 'express';

export function sendMedia(request: Request, response: Response, media: { data: Buffer; mimeType: string }) {
  const size = media.data.length;
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('Accept-Ranges', 'bytes');
  response.setHeader('Content-Type', media.mimeType);
  const range = request.headers['if-range'] ? undefined : request.headers.range;
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    const start = match?.[1] ? Number(match[1]) : Math.max(0, size - Number(match?.[2]));
    const end = match?.[1] && match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
    if (!match || (!match[1] && !match[2]) || !Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= size) {
      response.setHeader('Content-Range', `bytes */${size}`);
      response.status(416).end();
      return;
    }
    response.setHeader('Content-Range', `bytes ${start}-${end}/${size}`);
    response.setHeader('Content-Length', end - start + 1);
    response.status(206).send(media.data.subarray(start, end + 1));
    return;
  }
  response.setHeader('Content-Length', size);
  response.send(media.data);
}
