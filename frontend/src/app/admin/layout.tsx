'use client';

import { BookMarked, GraduationCap, LayoutDashboard, Megaphone, MessageCircle, School, Settings, UserCheck, Users } from 'lucide-react';
import { PortalLayout, type PortalNavItem } from '@/components/shared/portal-layout';

const navItems: PortalNavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Students', href: '/admin/students', icon: GraduationCap },
  { label: 'Teachers', href: '/admin/teachers', icon: Users },
  { label: 'Classes', href: '/admin/classes', icon: School },
  { label: 'Modules', href: '/admin/modules', icon: BookMarked },
  { label: 'Parent Approvals', href: '/admin/parent-approvals', icon: UserCheck },
  { label: 'Announcements', href: '/admin/announcements', icon: Megaphone },
  { label: 'Messages', href: '/admin/messages', icon: MessageCircle },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalLayout
      title="Admin Portal"
      navItems={navItems}
      profileHref="/admin/profile"
      backgroundImage="/students-workshop.png"
      message="Leadership turns a shared vision into opportunities for every learner."
    >
      {children}
    </PortalLayout>
  );
}
