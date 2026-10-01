'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { HomePortalLink } from '@/components/shared/home-portal-link';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { MobileHomeNav } from '@/components/layout/mobile-home-nav';

export function PublicHeader() {
  const pathname = usePathname();
  const navClass = (href: string) => pathname.startsWith(href) ? 'text-cyan-300' : 'hover:text-white';
  return <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/95 text-white backdrop-blur-xl">
    <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
      <Link href="/" className="flex items-center gap-2" aria-label="School home"><span className="flex size-12 items-center justify-center rounded-2xl bg-white p-1.5"><Image src="/school-logo.png" alt="School crest" width={62} height={42} className="h-auto w-full" /></span><span className="leading-tight"><span className="block text-sm font-black">G.S BTR RWAMIKO TSS</span><span className="block text-[9px] uppercase tracking-[0.18em] text-cyan-200">Skills • Character • Future</span></span></Link>
      <nav className="hidden items-center gap-7 text-sm font-semibold text-white/80 xl:flex"><Link href="/#school-updates" className="hover:text-white">School updates</Link><Link href="/our-story" className={navClass('/our-story')}>Our story</Link><Link href="/programmes" className={navClass('/programmes')}>Programmes</Link><Link href="/student-life" className={navClass('/student-life')}>Student life</Link></nav>
      <div className="hidden items-center gap-3 sm:flex"><LanguageSwitcher compact /><Link href="/admissions" className="flex items-center gap-1 text-sm font-bold hover:text-cyan-200">Apply now <ArrowRight className="size-4" /></Link><HomePortalLink className="inline-flex min-h-11 items-center gap-2 rounded-full bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-cyan-300" /></div><MobileHomeNav />
    </div>
  </header>;
}
