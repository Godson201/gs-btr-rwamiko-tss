'use client';

import type { ComponentProps } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAppInstall } from '@/components/providers/app-install-provider';

export function InstallAppLink({ onClick, ...props }: Omit<ComponentProps<typeof Link>, 'href'>) {
  const { available, installed, install } = useAppInstall();
  const router = useRouter();
  return <Link {...props} href="/install" onClick={async event => {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (!available || installed) return;
    // Prompt during the click itself: browsers require a user gesture.
    event.preventDefault();
    const result = await install();
    if (result === 'accepted') toast.success('Installation requested. Follow your device’s prompt to finish.');
    else if (result === 'dismissed') toast.info('You can install later from Get the app.');
    else router.push('/install');
  }} />;
}
