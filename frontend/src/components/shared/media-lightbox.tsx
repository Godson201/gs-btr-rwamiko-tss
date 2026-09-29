'use client';

import { useState } from 'react';
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
    toast.error('The file could not be downloaded. Try again; if it is missing, ask the uploader to upload it again.');
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
  const [mediaError, setMediaError] = useState(false);
  return <Dialog open={open} onOpenChange={next => { setMediaError(false); onOpenChange(next); }}>
    <DialogContent className="max-w-5xl bg-slate-950 text-white" aria-describedby={undefined}>
      <DialogTitle className="truncate">{attachment.filename}</DialogTitle>
      {mediaError && <p role="alert" className="p-4 text-center">This file could not be opened. It may be missing or use an unsupported format. Please contact the school.</p>}
      {open && !mediaError && (attachment.type === 'IMAGE' ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img onError={() => setMediaError(true)} src={src} alt={attachment.filename} className="max-h-[65dvh] w-full rounded-md object-contain" />
      ) : <video onError={() => setMediaError(true)} src={src} controls autoPlay playsInline preload="metadata" className="max-h-[65dvh] w-full rounded-md" />)}
      <div className="flex flex-wrap items-center gap-2">
        {mediaError && <Button type="button" variant="secondary" size="sm" onClick={() => setMediaError(false)}>Try again</Button>}
        <Button type="button" variant="secondary" size="sm" onClick={() => downloadAttachment(src, attachment.filename)}><Download />Download</Button>
        <Button type="button" variant="secondary" size="sm" onClick={() => shareAttachment(src, attachment.filename)}><Share2 />Share</Button>
      </div>
    </DialogContent>
  </Dialog>;
}
