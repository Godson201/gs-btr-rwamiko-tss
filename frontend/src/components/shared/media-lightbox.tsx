'use client';

import { useEffect } from 'react';
import { Download, Share2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import type { AttachmentLike } from './attachment-preview';

const UPLOADS_BASE_URL = process.env.NEXT_PUBLIC_UPLOADS_BASE_URL ?? '';

export async function downloadAttachment(src: string, filename: string) {
  // The download attribute is silently ignored by browsers for cross-origin URLs (the uploads
  // server is a different origin/port than the frontend), so a plain <a download> just navigates
  // instead of saving the file. Fetching as a blob and downloading via an object URL forces the save.
  try {
    const response = await fetch(src);
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
  const src = `${UPLOADS_BASE_URL}${attachment.url}`;

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={attachment.filename}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/95 p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onOpenChange(false);
      }}
    >
      <button
        type="button"
        onClick={() => onOpenChange(false)}
        aria-label="Close"
        className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
      >
        <X className="size-5" />
      </button>

      <div className="flex max-h-[80vh] max-w-full items-center justify-center">
        {attachment.type === 'IMAGE' ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={attachment.filename}
            className="max-h-[80vh] max-w-full rounded-md object-contain"
          />
        ) : (
          <video src={src} controls autoPlay className="max-h-[80vh] max-w-full rounded-md" />
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => downloadAttachment(src, attachment.filename)}
        >
          <Download className="size-4" />
          Download
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={() => shareAttachment(src, attachment.filename)}>
          <Share2 className="size-4" />
          Share
        </Button>
      </div>
    </div>
  );
}
