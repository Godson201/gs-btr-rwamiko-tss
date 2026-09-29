'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { InstallAppLink } from '@/components/shared/install-app-link';

export function MobileHomeNav() {
  const [open, setOpen] = useState(false);
  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild>
      <Button variant="ghost" size="icon" className="shrink-0 border border-white/30 text-white xl:hidden" aria-label="Open navigation"><Menu /></Button>
    </DialogTrigger>
    <DialogContent>
      <DialogTitle>G.S BTR RWAMIKO TSS</DialogTitle>
      <nav aria-label="School navigation" className="grid gap-2">
        {[
          ['School updates', '/#school-updates'], ['Our story', '/#story'], ['Programmes', '/#programmes'],
          ['Student life', '/#student-life'], ['Apply now', '/admissions'],
          ['Portal login', '/auth/login'],
        ].map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)} className="flex min-h-11 items-center rounded-md px-3 py-2 font-medium hover:bg-accent">{label}</Link>)}
        <InstallAppLink onClick={() => setOpen(false)} className="flex min-h-11 items-center rounded-md px-3 py-2 font-medium hover:bg-accent">Get the app</InstallAppLink>
      </nav>
      <LanguageSwitcher />
    </DialogContent>
  </Dialog>;
}
