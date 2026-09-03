'use client';

import { BookOpen, CalendarCheck, ClipboardCheck, FileQuestion, GraduationCap, LayoutDashboard, Library, Megaphone, MessageCircle, Newspaper, Settings, ShieldCheck } from 'lucide-react';
import { PortalLayout, type PortalNavItem } from '@/components/shared/portal-layout';
import { useAuth } from '@/contexts/auth-context';

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const navItems: PortalNavItem[] = [
    { label: 'Dashboard', href: '/teacher/dashboard', icon: LayoutDashboard },
    { label: 'Classes & Trades', href: '/teacher/classes', icon: GraduationCap },
    { label: 'Teaching Modules', href: '/teacher/modules', icon: BookOpen },
    { label: 'Attendance', href: '/teacher/attendance', icon: CalendarCheck },
    { label: 'Assessments', href: '/teacher/assessments', icon: ClipboardCheck },
    { label: 'Marks', href: '/teacher/marks', icon: GraduationCap },
    { label: 'Question Bank', href: '/teacher/question-bank', icon: FileQuestion },
    { label: 'Notes & Manuals', href: '/teacher/resources', icon: Library },
    { label: 'Good Conduct', href: '/teacher/conduct', icon: ShieldCheck },
    { label: 'Announcements', href: '/teacher/announcements', icon: Megaphone },
    { label: 'Messages', href: '/teacher/messages', icon: MessageCircle },
    { label: 'Settings', href: '/teacher/settings', icon: Settings },
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
