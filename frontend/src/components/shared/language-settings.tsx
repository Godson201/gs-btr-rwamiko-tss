'use client';

import { Languages } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage, type Language } from '@/contexts/language-context';

export function LanguageSettings() {
  const { language, setLanguage, t } = useLanguage();
  return <Card><CardHeader><div className="flex items-center gap-3"><span className="rounded-xl bg-cyan-100 p-2 text-cyan-800"><Languages className="size-5" /></span><div><CardTitle className="text-base">{t('language.settings')}</CardTitle><CardDescription>{t('language.description')}</CardDescription></div></div></CardHeader><CardContent><div className="grid gap-3 sm:grid-cols-2">{([['en', 'English', 'Use the system in English'], ['rw', 'Kinyarwanda', 'Koresha sisitemu mu Kinyarwanda']] as [Language,string,string][]).map(([value,label,description]) => <button type="button" key={value} onClick={() => setLanguage(value)} className={`rounded-2xl border-2 p-4 text-left transition ${language === value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}><span className="font-bold">{label}</span><span className="mt-1 block text-xs text-muted-foreground">{description}</span></button>)}</div><p className="mt-4 text-xs text-muted-foreground">{t('language.saved')}</p></CardContent></Card>;
}
