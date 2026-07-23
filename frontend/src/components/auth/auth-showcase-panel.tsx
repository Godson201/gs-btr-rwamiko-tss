'use client';

import { useEffect, useState } from 'react';
import { GraduationCap, Wrench, Zap } from 'lucide-react';

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
    <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-10 text-primary-foreground lg:flex">
      <div className="pointer-events-none absolute inset-0 opacity-10">
        <div className="absolute -top-16 -right-16 size-72 rounded-full bg-white blur-3xl" />
        <div className="absolute bottom-0 left-0 size-96 rounded-full bg-white blur-3xl" />
      </div>

      <div className="relative z-10 space-y-1">
        <p className="text-sm font-semibold tracking-wide uppercase opacity-80">
          G.S BTR RWAMIKO TSS
        </p>
        <p className="text-xs opacity-70">&ldquo;Through Here, Wealth is Flash&rdquo;</p>
      </div>

      <div className="relative z-10 space-y-4">
        <h2 className="text-3xl font-bold leading-tight">{title}</h2>
        <p className="max-w-sm text-sm opacity-90">{description}</p>
        <div className="flex gap-3 pt-2 opacity-80">
          <GraduationCap className="size-5" />
          <Wrench className="size-5" />
          <Zap className="size-5" />
        </div>
      </div>

      <div className="relative z-10 min-h-16 max-w-sm text-sm italic opacity-90">
        {QUOTES[quoteIndex]}
      </div>
    </div>
  );
}
