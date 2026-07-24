import { FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

const UPLOADS_BASE_URL = process.env.NEXT_PUBLIC_UPLOADS_BASE_URL ?? '';

export interface AttachmentLike {
  id: string;
  url: string;
  type: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT';
  filename: string;
}

export function AttachmentPreview({
  attachment,
  className,
}: {
  attachment: AttachmentLike;
  className?: string;
}) {
  const src = `${UPLOADS_BASE_URL}${attachment.url}`;

  if (attachment.type === 'IMAGE') {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={attachment.filename}
        className={cn('aspect-video w-full rounded-md object-cover', className)}
      />
    );
  }

  if (attachment.type === 'VIDEO') {
    return <video src={src} controls className={cn('aspect-video w-full rounded-md', className)} />;
  }

  if (attachment.type === 'AUDIO') {
    return <audio src={src} controls className={cn('w-full', className)} />;
  }

  return (
    <a
      href={src}
      target="_blank"
      rel="noreferrer"
      download={attachment.filename}
      className={cn(
        'flex items-center gap-2 rounded-md border p-2 text-sm hover:bg-accent',
        className,
      )}
    >
      <FileText className="size-5 shrink-0 text-muted-foreground" />
      <span className="truncate">{attachment.filename}</span>
    </a>
  );
}
