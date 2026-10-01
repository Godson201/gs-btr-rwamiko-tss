'use client';

import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

function PasswordInput({ className, ...props }: Omit<React.ComponentProps<'input'>, 'type'>) {
  const [visible, setVisible] = React.useState(false);

  return <div className="relative">
    <Input
      {...props}
      type={visible ? 'text' : 'password'}
      className={cn('pr-11', className)}
    />
    <button
      type="button"
      onClick={() => setVisible((current) => !current)}
      className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50"
      aria-label={visible ? 'Hide password' : 'Show password'}
      aria-pressed={visible}
    >
      {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
    </button>
  </div>;
}

export { PasswordInput };
