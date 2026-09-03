'use client';

import { LayoutDashboard, Megaphone, MessageCircle, Newspaper } from 'lucide-react';
import { PortalLayout, type PortalNavItem } from '@/components/shared/portal-layout';
import { useAuth } from '@/contexts/auth-context';

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const navItems: PortalNavItem[] = [
    { label: 'Dashboard', href: '/teacher/dashboard', icon: LayoutDashboard },
    { label: 'Announcements', href: '/teacher/announcements', icon: Megaphone },
    { label: 'Messages', href: '/teacher/messages', icon: MessageCircle },
  ];

  if (user?.staffTitle) {
    navItems.push({ label: 'School Posts', href: '/teacher/posts', icon: Newspaper });
  }

  return (
    <PortalLayout title="Teacher Portal" navItems={navItems} profileHref="/teacher/profile" backgroundImage="/students-classroom.png" message="A great teacher does more than share knowledge—they awaken possibility.">
      {children}
    </PortalLayout>
  );
}
