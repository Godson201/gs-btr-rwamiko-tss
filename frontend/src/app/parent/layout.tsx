'use client';

import { LayoutDashboard, MessageCircle } from 'lucide-react';
import { PortalLayout, type PortalNavItem } from '@/components/shared/portal-layout';

const navItems: PortalNavItem[] = [
  { label: 'Dashboard', href: '/parent/dashboard', icon: LayoutDashboard },
  { label: 'Messages', href: '/parent/messages', icon: MessageCircle, disabled: true },
];

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalLayout title="Parent Portal" navItems={navItems}>
      {children}
    </PortalLayout>
  );
}
