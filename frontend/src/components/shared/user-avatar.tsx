import { cn } from '@/lib/utils';

const UPLOADS_BASE_URL = process.env.NEXT_PUBLIC_UPLOADS_BASE_URL ?? '';

export function UserAvatar({
  avatar,
  firstName,
  lastName,
  className,
}: {
  avatar?: string | null;
  firstName?: string;
  lastName?: string;
  className?: string;
}) {
  const src = avatar ? `${UPLOADS_BASE_URL}${avatar}` : null;

  return (
    <span
      className={cn(
        'inline-flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-xs font-semibold text-muted-foreground',
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        <>
          {firstName?.[0]}
          {lastName?.[0]}
        </>
      )}
    </span>
  );
}
