'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { LucideIcon } from 'lucide-react';
import { Download, House, LogOut, Menu, User } from 'lucide-react';
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
import { InstallAppLink } from '@/components/shared/install-app-link';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage, type TranslationKey } from '@/contexts/language-context';
import { cn } from '@/lib/utils';

export interface PortalNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  disabled?: boolean;
  requiredPermission?: string;
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
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout, hasPermission } = useAuth();
  const { t } = useLanguage();
  const portalKey: TranslationKey = title === 'Admin Portal' ? 'portal.admin' : title === 'Teacher Portal' ? 'portal.teacher' : 'portal.parent';
  const messageKey: TranslationKey = title === 'Admin Portal' ? 'message.admin' : title === 'Teacher Portal' ? 'message.teacher' : 'message.parent';
  const visibleNavItems = navItems.filter(
    (item) => !item.requiredPermission || hasPermission(item.requiredPermission),
  );

  return (
    <div className="grid min-h-dvh grid-cols-[minmax(0,1fr)] md:grid-cols-[76px_minmax(0,1fr)] lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh md:flex flex-col overflow-hidden border-r bg-card">
        <div className="flex h-16 items-center justify-center border-b px-2 lg:justify-start lg:px-4">
          <Link href="/" aria-label="G.S BTR RWAMIKO TSS home">
            <SchoolBrand compact />
          </Link>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-2 lg:p-3">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.disabled ? '#' : item.href}
                aria-disabled={item.disabled}
                aria-label={navTranslationKeys[item.label] ? t(navTranslationKeys[item.label]) : item.label}
                aria-current={isActive ? 'page' : undefined}
                onClick={(event) => { if (item.disabled) event.preventDefault(); }}
                className={cn(
                  'flex items-center justify-center gap-2 min-h-11 rounded-md px-3 py-2 text-sm font-medium transition-colors lg:justify-start',
                  item.disabled
                    ? 'cursor-not-allowed text-muted-foreground/50'
                    : isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                <Icon className="size-4" />
                <span className="hidden lg:inline">{navTranslationKeys[item.label] ? t(navTranslationKeys[item.label]) : item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-40 flex min-h-16 flex-wrap items-center justify-between gap-2 border-b bg-background px-3 py-2 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
              <DialogTrigger asChild><Button variant="outline" size="icon" className="md:hidden" aria-label="Open navigation"><Menu /></Button></DialogTrigger>
              <DialogContent className="md:hidden">
                <DialogTitle>{t(portalKey)}</DialogTitle>
                <nav aria-label="Portal navigation" className="grid gap-1">
                  {visibleNavItems.map((item) => {
                    const Icon = item.icon;
                    return <Link key={item.href} href={item.disabled ? '#' : item.href}
                      aria-disabled={item.disabled} aria-current={pathname.startsWith(item.href) ? 'page' : undefined}
                      onClick={(event) => { if (item.disabled) event.preventDefault(); else setMenuOpen(false); }}
                      className={cn('flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium', item.disabled ? 'text-muted-foreground/50' : pathname.startsWith(item.href) ? 'bg-primary text-primary-foreground' : 'hover:bg-accent')}>
                      <Icon className="size-5 shrink-0" />{navTranslationKeys[item.label] ? t(navTranslationKeys[item.label]) : item.label}
                    </Link>;
                  })}
                </nav>
              </DialogContent>
            </Dialog>
            <h1 className="text-base font-semibold sm:text-lg">{t(portalKey)}</h1>
          </div>
          <Button asChild variant="outline" size="sm" className="ml-auto min-h-11">
            <Link href="/" data-no-translate><House className="size-4" />{t('nav.home')}</Link>
          </Button>
          <div className="ml-auto flex flex-wrap items-center gap-2 sm:ml-0">
            <LanguageSwitcher compact /><DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="min-h-11 px-2 sm:pl-1.5" aria-label={user ? `${user.firstName} ${user.lastName}: account menu` : t('account')}>
                <UserAvatar avatar={user?.avatar} firstName={user?.firstName} lastName={user?.lastName} className="size-6" />
                <span className="hidden max-w-40 truncate sm:inline">{user ? `${user.firstName} ${user.lastName}` : t('account')}</span>
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
              <DropdownMenuItem asChild>
                <InstallAppLink><Download className="mr-2 size-4" />Get the app</InstallAppLink>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu></div>
        </header>
        <main className="relative min-w-0 flex-1 overflow-hidden bg-slate-100 p-3 sm:p-6 lg:p-8">
          <Image src={backgroundImage} alt="" fill sizes="(min-width: 1024px) calc(100vw - 240px), (min-width: 768px) calc(100vw - 76px), 100vw" className="pointer-events-none object-cover object-center opacity-35" priority />
          <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-white/30 via-transparent to-cyan-50/35" />
          <div className="relative z-10 mb-5 flex items-center gap-3 rounded-2xl border border-white bg-white px-5 py-3 shadow-xl">
            <span className="h-8 w-1 rounded-full bg-cyan-500" />
            <p className="text-sm font-semibold italic text-slate-700">“{t(messageKey) || message}”</p>
          </div>
          <div className="relative z-10 min-w-0 rounded-2xl border border-white bg-white p-3 sm:rounded-[2rem] shadow-2xl sm:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
