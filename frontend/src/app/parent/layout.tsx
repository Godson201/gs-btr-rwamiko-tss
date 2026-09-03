'use client';

import { GraduationCap, LayoutDashboard, Megaphone, MessageCircle, Settings } from 'lucide-react';
import { PortalLayout, type PortalNavItem } from '@/components/shared/portal-layout';

const navItems: PortalNavItem[] = [
  { label: 'Dashboard', href: '/parent/dashboard', icon: LayoutDashboard },
  { label: 'Announcements', href: '/parent/announcements', icon: Megaphone },
  { label: 'Messages', href: '/parent/messages', icon: MessageCircle },
  { label: 'Apply for Admission', href: '/admissions', icon: GraduationCap },
  { label: 'Settings', href: '/parent/settings', icon: Settings },
];

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalLayout title="Parent Portal" navItems={navItems} profileHref="/parent/profile" backgroundImage="/students-campus.png" message="When school and family walk together, every learner moves forward.">
      {children}
    </PortalLayout>
  );
}
