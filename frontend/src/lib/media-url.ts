export function mediaUrl(url: string): string {
  if (url.startsWith('/api/public-media/') || url.startsWith('/uploads/announcements/') || url.startsWith('/uploads/messages/')) return url;
  return `${process.env.NEXT_PUBLIC_UPLOADS_BASE_URL ?? ''}${url}`;
}
