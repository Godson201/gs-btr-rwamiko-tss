'use client';

import { useState } from 'react';
import { Download, FileText, Maximize2, Share2 } from 'lucide-react';
import { ScrollVideo } from '@/components/shared/scroll-video';
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
    <div className="absolute top-1 right-1 flex gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
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
      <p>{attachment.type === 'VIDEO' ? 'Video unavailable' : attachment.type === 'AUDIO' ? 'Audio unavailable' : 'Photo unavailable'}</p>
      <p className="text-xs">Try again or download the file. If it is missing, the uploader will need to upload it again.</p>
      <div className="flex gap-3">
        <button type="button" className="underline" onClick={() => setMediaError(false)}>Try again</button>
        <button type="button" className="underline" onClick={() => downloadAttachment(src, attachment.filename)}>Download</button>
      </div>
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
      <div className={cn('w-full space-y-1', className)}>
        <ScrollVideo src={src} filename={attachment.filename} suspended={lightboxOpen} onError={() => setMediaError(true)} />
        <button type="button" onClick={() => setLightboxOpen(true)}
          aria-label={`Expand video: ${attachment.filename}`}
          className="flex min-h-11 items-center gap-2 text-sm underline">
          <Maximize2 className="size-4" />Expand video
        </button>
      </div>
      <MediaLightbox attachment={attachment} open={lightboxOpen} onOpenChange={setLightboxOpen} />
    </>;
  }

  if (attachment.type === 'AUDIO') {
    return (
      <div className={cn('flex w-full items-center gap-2', className)}>
        <audio src={src} controls preload="metadata" onError={() => setMediaError(true)} className="min-w-0 w-full" />
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
