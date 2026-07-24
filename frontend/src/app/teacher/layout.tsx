'use client';

import { LayoutDashboard, Megaphone, MessageCircle } from 'lucide-react';
import { PortalLayout, type PortalNavItem } from '@/components/shared/portal-layout';

const navItems: PortalNavItem[] = [
  { label: 'Dashboard', href: '/teacher/dashboard', icon: LayoutDashboard },
  { label: 'Announcements', href: '/teacher/announcements', icon: Megaphone },
  { label: 'Messages', href: '/teacher/messages', icon: MessageCircle },
];

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalLayout title="Teacher Portal" navItems={navItems}>
      {children}
    </PortalLayout>
  );
}
