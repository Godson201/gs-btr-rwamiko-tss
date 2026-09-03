'use client';

import { useEffect, useState } from 'react';
import { GraduationCap, Wrench, Zap } from 'lucide-react';
import Image from 'next/image';
import { LanguageSwitcher } from '@/components/shared/language-switcher';

const QUOTES = [
  '"Skill is the bridge between a dream and reality." — TVET Rwanda',
  '"A trade in your hands is wealth for a lifetime."',
  '"Practice builds mastery; mastery builds the nation."',
  '"Every expert was once a beginner who kept showing up."',
  '"Technical skills open doors that certificates alone cannot."',
];

export function AuthShowcasePanel({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((current) => (current + 1) % QUOTES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative hidden flex-col justify-between overflow-hidden bg-slate-950 p-10 text-white lg:flex">
      <Image src="/students-campus.png" alt="Students arriving on campus" fill priority sizes="50vw" className="auth-story-image object-cover object-center" />
      <div className="absolute inset-0 bg-linear-to-r from-slate-950 via-slate-950/80 to-slate-950/20" />
      <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-transparent to-slate-950/50" />
      <div className="school-grid pointer-events-none absolute inset-0 opacity-20" />
      <div className="absolute right-6 top-6 z-20"><LanguageSwitcher compact /></div>

      <div className="relative z-10 space-y-3">
        <div className="w-fit rounded-2xl bg-white/95 p-2 shadow-lg ring-1 ring-white/30">
          <Image
            src="/school-logo.png"
            alt="G.S Benjamin Tito Robert Rwamiko TSS crest"
            width={150}
            height={100}
            className="h-24 w-auto object-contain"
            priority
          />
        </div>
        <p className="text-sm font-semibold tracking-wide uppercase opacity-80">
          G.S BTR RWAMIKO TSS
        </p>
        <p className="text-xs opacity-70">&ldquo;Through Here, Wealth is Flash&rdquo;</p>
      </div>

      <div className="relative z-10 max-w-md space-y-4 rounded-3xl border border-white/15 bg-slate-950/35 p-6 shadow-2xl backdrop-blur-sm">
        <h2 className="text-4xl font-black leading-tight tracking-tight">{title}</h2>
        <p className="max-w-sm text-sm leading-6 text-slate-100">{description}</p>
        <div className="flex gap-3 pt-2 opacity-80">
          <GraduationCap className="size-5" />
          <Wrench className="size-5" />
          <Zap className="size-5" />
        </div>
      </div>

      <div className="relative z-10 min-h-16 max-w-sm border-l-2 border-cyan-300 pl-4 text-sm italic text-cyan-50">
        {QUOTES[quoteIndex]}
      </div>
    </div>
  );
}
