import { NextRequest, NextResponse } from 'next/server';
import { proxyMedia } from '@/lib/media-proxy';

export async function GET(request: NextRequest, context: { params: Promise<{ announcementId: string; attachmentId: string }> }) {
  const { announcementId, attachmentId } = await context.params;
  if (![announcementId, attachmentId].every(id => /^[a-zA-Z0-9_-]+$/.test(id))) {
    return NextResponse.json({ message: 'Media not found' }, { status: 404 });
  }
  return proxyMedia(request, new URL(`${process.env.API_URL}/public/school-updates/${announcementId}/media/${attachmentId}`));
}
