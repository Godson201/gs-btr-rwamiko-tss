import Image from 'next/image';
import { cn } from '@/lib/utils';

export function SchoolBrand({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Image
        src="/school-logo.png"
        alt="G.S Benjamin Tito Robert Rwamiko TSS crest"
        width={compact ? 52 : 72}
        height={compact ? 35 : 48}
        className="h-auto shrink-0 object-contain"
        priority
      />
      <div className="min-w-0 leading-tight">
        <p className={cn('font-bold tracking-tight text-primary', compact ? 'text-xs' : 'text-sm')}>
          G.S BTR RWAMIKO TSS
        </p>
        {!compact && (
          <p className="mt-1 text-[10px] text-muted-foreground">
            Through Here, Wealth is Flash
          </p>
        )}
      </div>
    </div>
  );
}
