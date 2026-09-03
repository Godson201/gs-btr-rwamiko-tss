'use client';

import { Languages } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage, t } = useLanguage();
  return <label className="flex items-center gap-2 rounded-full border bg-background px-3 py-1.5 text-xs font-semibold shadow-sm"><Languages className="size-4 text-primary" /><span className={compact ? 'sr-only' : ''}>{t('language.label')}</span><select value={language} onChange={event => setLanguage(event.target.value as 'en' | 'rw')} className="bg-transparent font-semibold outline-none" aria-label={t('language.label')}><option value="en">English</option><option value="rw">Kinyarwanda</option></select></label>;
}
