'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';

export function HomePortalLink({ className, onClick }: { className?: string; onClick?: () => void }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  // The sign-in route redirects an existing session to its permitted portal.
  return <Link href="/auth/login" className={className} onClick={onClick} data-no-translate>
    {t(user ? 'portal.return' : 'portal.login')}<ArrowRight className="size-4 shrink-0" />
  </Link>;
}
