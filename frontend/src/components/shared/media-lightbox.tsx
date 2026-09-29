'use client';

import { Download, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import type { AttachmentLike } from './attachment-preview';

import { mediaUrl } from '@/lib/media-url';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

export async function downloadAttachment(src: string, filename: string) {
  // The download attribute is silently ignored by browsers for cross-origin URLs (the uploads
  // server is a different origin/port than the frontend), so a plain <a download> just navigates
  // instead of saving the file. Fetching as a blob and downloading via an object URL forces the save.
  try {
    const response = await fetch(src);
    if (!response.ok) throw new Error('Download failed');
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
  } catch {
    window.open(src, '_blank');
  }
}

export async function shareAttachment(src: string, filename: string) {
  const absoluteUrl = typeof window !== 'undefined' ? new URL(src, window.location.origin).toString() : src;

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title: filename, url: absoluteUrl });
    } catch {
      // user dismissed the native share sheet
    }
    return;
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    await navigator.clipboard.writeText(absoluteUrl);
    toast.success('Link copied to clipboard');
  }
}

export function MediaLightbox({
  attachment,
  open,
  onOpenChange,
}: {
  attachment: AttachmentLike;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const src = mediaUrl(attachment.url);
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-5xl bg-slate-950 text-white" aria-describedby={undefined}>
      <DialogTitle className="truncate">{attachment.filename}</DialogTitle>
      {open && (attachment.type === 'IMAGE' ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={attachment.filename} className="max-h-[65dvh] w-full rounded-md object-contain" />
      ) : <video src={src} controls autoPlay playsInline preload="metadata" className="max-h-[65dvh] w-full rounded-md" />)}
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={() => downloadAttachment(src, attachment.filename)}><Download />Download</Button>
        <Button type="button" variant="secondary" size="sm" onClick={() => shareAttachment(src, attachment.filename)}><Share2 />Share</Button>
      </div>
    </DialogContent>
  </Dialog>;
}
