'use client';

import type { LucideIcon } from 'lucide-react';
import { LogOut, User } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserAvatar } from '@/components/shared/user-avatar';
import { SchoolBrand } from '@/components/shared/school-brand';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage, type TranslationKey } from '@/contexts/language-context';
import { cn } from '@/lib/utils';

export interface PortalNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  disabled?: boolean;
}

const navTranslationKeys: Record<string, TranslationKey> = {
  Dashboard: 'nav.dashboard', Students: 'nav.students', Teachers: 'nav.teachers', Classes: 'nav.classes', Modules: 'nav.modules',
  'Parent Approvals': 'nav.parentApprovals', Admissions: 'nav.admissions', Announcements: 'nav.announcements', Messages: 'nav.messages',
  Settings: 'nav.settings', 'School Posts': 'nav.schoolPosts', 'Apply for Admission': 'nav.apply',
};

export function PortalLayout({
  title,
  navItems,
  profileHref,
  backgroundImage = '/students-classroom.png',
  message = 'Every lesson is one more step toward the future you are building.',
  children,
}: {
  title: string;
  navItems: PortalNavItem[];
  profileHref: string;
  backgroundImage?: string;
  message?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const portalKey: TranslationKey = title === 'Admin Portal' ? 'portal.admin' : title === 'Teacher Portal' ? 'portal.teacher' : 'portal.parent';
  const messageKey: TranslationKey = title === 'Admin Portal' ? 'message.admin' : title === 'Teacher Portal' ? 'message.teacher' : 'message.parent';

  return (
    <div className="grid min-h-screen grid-cols-[240px_1fr]">
      <aside className="flex flex-col border-r bg-card">
        <div className="flex h-16 items-center border-b px-4">
          <Link href="/" aria-label="G.S BTR RWAMIKO TSS home">
            <SchoolBrand compact />
          </Link>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.disabled ? '#' : item.href}
                aria-disabled={item.disabled}
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  item.disabled
                    ? 'cursor-not-allowed text-muted-foreground/50'
                    : isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                <Icon className="size-4" />
                {navTranslationKeys[item.label] ? t(navTranslationKeys[item.label]) : item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex flex-col">
        <header className="flex h-16 items-center justify-between border-b bg-background px-6">
          <h1 className="text-lg font-semibold">{t(portalKey)}</h1>
          <div className="flex items-center gap-3"><LanguageSwitcher compact /><DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-auto py-1 pl-1.5">
                <UserAvatar avatar={user?.avatar} firstName={user?.firstName} lastName={user?.lastName} className="size-6" />
                {user ? `${user.firstName} ${user.lastName}` : t('account')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={profileHref}>
                  <User className="mr-2 size-4" />
                  {t('profile')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => logout()}>
                <LogOut className="mr-2 size-4" />
                {t('logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu></div>
        </header>
        <main className="relative flex-1 overflow-hidden bg-slate-100 p-4 sm:p-6 lg:p-8">
          <Image src={backgroundImage} alt="" fill sizes="calc(100vw - 240px)" className="pointer-events-none object-cover object-center opacity-35" priority />
          <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-white/30 via-transparent to-cyan-50/35" />
          <div className="relative z-10 mb-5 flex items-center gap-3 rounded-2xl border border-white bg-white px-5 py-3 shadow-xl">
            <span className="h-8 w-1 rounded-full bg-cyan-500" />
            <p className="text-sm font-semibold italic text-slate-700">“{t(messageKey) || message}”</p>
          </div>
          <div className="relative z-10 rounded-[2rem] border border-white bg-white p-5 shadow-2xl sm:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
