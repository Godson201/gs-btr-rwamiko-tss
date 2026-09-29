'use client';

import { useState } from 'react';
import { Download, FileText, Play, Share2 } from 'lucide-react';
import { downloadAttachment, MediaLightbox, shareAttachment } from '@/components/shared/media-lightbox';
import { cn } from '@/lib/utils';

import { mediaUrl } from '@/lib/media-url';

export interface AttachmentLike {
  id: string;
  url: string;
  type: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT';
  filename: string;
}

function HoverToolbar({ src, filename }: { src: string; filename: string }) {
  return (
    <div className="absolute top-1 right-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          downloadAttachment(src, filename);
        }}
        className="rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
        aria-label="Download"
      >
        <Download className="size-3.5" />
      </button>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          shareAttachment(src, filename);
        }}
        className="rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
        aria-label="Share"
      >
        <Share2 className="size-3.5" />
      </button>
    </div>
  );
}

export function AttachmentPreview({
  attachment,
  className,
}: {
  attachment: AttachmentLike;
  className?: string;
}) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [mediaError, setMediaError] = useState(false);
  const src = mediaUrl(attachment.url);

  if (mediaError) {
    return <div className={cn('flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-md border bg-slate-50 p-4 text-center text-sm text-slate-600', className)} role="status">
      <FileText className="size-7" />
      <p>{attachment.type === 'VIDEO' ? 'Video unavailable' : 'Photo unavailable'}</p>
      <p className="text-xs">The school needs to upload this file again.</p>
    </div>;
  }

  if (attachment.type === 'IMAGE') {
    return (
      <>
        <div
          role="button"
          tabIndex={0}
          onClick={() => setLightboxOpen(true)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setLightboxOpen(true); }
          }}
          className={cn('group relative block w-full cursor-pointer', className)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            onError={() => setMediaError(true)}
            loading="lazy"
            src={src}
            alt={attachment.filename}
            className="aspect-video w-full rounded-md object-cover"
          />
          <HoverToolbar src={src} filename={attachment.filename} />
        </div>
        <MediaLightbox attachment={attachment} open={lightboxOpen} onOpenChange={setLightboxOpen} />
      </>
    );
  }

  if (attachment.type === 'VIDEO') {
    return <>
      <button type="button" onClick={() => setLightboxOpen(true)}
        aria-label={`Play video: ${attachment.filename}`}
        className={cn('group relative block aspect-video w-full overflow-hidden rounded-md bg-slate-900', className)}>
        <video src={`${src}#t=0.1`} muted playsInline preload="metadata" aria-hidden="true" onError={() => setMediaError(true)}
          className="pointer-events-none aspect-video w-full object-cover" />
        <span className="absolute inset-0 flex items-center justify-center bg-black/15">
          <span className="flex size-12 items-center justify-center rounded-full bg-white/95 text-slate-900 shadow-lg"><Play className="size-6" /></span>
        </span>
        <span className="absolute bottom-2 left-2 rounded bg-black/70 px-2 py-1 text-xs text-white">Play video</span>
      </button>
      <MediaLightbox attachment={attachment} open={lightboxOpen} onOpenChange={setLightboxOpen} />
    </>;
  }

  if (attachment.type === 'AUDIO') {
    return (
      <div className={cn('flex w-full items-center gap-2', className)}>
        <audio src={src} controls className="w-full" />
        <button
          type="button"
          onClick={() => shareAttachment(src, attachment.filename)}
          className="shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-accent"
          aria-label="Share"
        >
          <Share2 className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => downloadAttachment(src, attachment.filename)}
          className="shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-accent"
          aria-label="Download"
        >
          <Download className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div className={cn('flex w-full items-center gap-1', className)}>
      <button
        type="button"
        onClick={() => downloadAttachment(src, attachment.filename)}
        className="flex flex-1 items-center gap-2 rounded-md border p-2 text-left text-sm hover:bg-accent"
      >
        <FileText className="size-5 shrink-0 text-muted-foreground" />
        <span className="truncate">{attachment.filename}</span>
      </button>
      <button
        type="button"
        onClick={() => shareAttachment(src, attachment.filename)}
        className="shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-accent"
        aria-label="Share"
      >
        <Share2 className="size-4" />
      </button>
    </div>
  );
}
