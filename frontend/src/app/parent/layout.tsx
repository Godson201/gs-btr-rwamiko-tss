'use client';

import { LayoutDashboard, Megaphone, MessageCircle } from 'lucide-react';
import { PortalLayout, type PortalNavItem } from '@/components/shared/portal-layout';

const navItems: PortalNavItem[] = [
  { label: 'Dashboard', href: '/parent/dashboard', icon: LayoutDashboard },
  { label: 'Announcements', href: '/parent/announcements', icon: Megaphone },
  { label: 'Messages', href: '/parent/messages', icon: MessageCircle },
];

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalLayout title="Parent Portal" navItems={navItems} profileHref="/parent/profile">
      {children}
    </PortalLayout>
  );
}
