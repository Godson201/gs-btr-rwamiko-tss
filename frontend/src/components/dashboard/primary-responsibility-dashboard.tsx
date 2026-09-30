'use client';

import {
  BookOpen,
  Building2,
  CalendarCheck,
  ChevronRight,
  ClipboardCheck,
  FileBarChart,
  GraduationCap,
  HeartHandshake,
  School,
  ShieldCheck,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { FeaturedPostsWidget } from '@/components/shared/featured-posts-widget';

type ResponsibilityCode = 'HEAD_TEACHER' | 'DOS' | 'DOD' | 'HOD' | 'PATRON' | 'MATRON';

type WorkspaceTool = {
  title: string;
  detail: string;
  icon: typeof School;
  href?: string;
};

const WORKSPACES: Record<ResponsibilityCode, {
  eyebrow: string;
  title: string;
  description: string;
  accent: string;
  tools: WorkspaceTool[];
}> = {
  HEAD_TEACHER: {
    eyebrow: 'School leadership',
    title: 'Head Teacher command centre',
    description: 'Review school-wide academic delivery, departments, staff priorities and management reports.',
    accent: 'from-indigo-950 via-blue-950 to-cyan-900',
    tools: [
      { title: 'Academic overview', detail: 'Review classes, trades and school structures', icon: School, href: '/teacher/classes' },
      { title: 'Curriculum delivery', detail: 'Monitor modules across departments', icon: BookOpen, href: '/teacher/modules' },
      { title: 'Staff oversight', detail: 'Review staffing and responsibility summaries', icon: Users },
      { title: 'School reports', detail: 'Management-level academic and operational reports', icon: FileBarChart },
    ],
  },
  DOS: {
    eyebrow: 'Academic leadership',
    title: 'Director of Studies workspace',
    description: 'Coordinate curriculum, teaching allocation, assessment preparation and academic performance.',
    accent: 'from-slate-950 via-blue-950 to-violet-900',
    tools: [
      { title: 'Classes and trades', detail: 'Coordinate academic structures and delivery groups', icon: School, href: '/teacher/classes' },
      { title: 'Curriculum modules', detail: 'Review modules and learning-hour coverage', icon: BookOpen, href: '/teacher/modules' },
      { title: 'Assessment management', detail: 'Coordinate quizzes, assignments and examinations', icon: ClipboardCheck, href: '/teacher/assessments' },
      { title: 'Academic performance', detail: 'Review marks and result readiness', icon: GraduationCap, href: '/teacher/marks' },
    ],
  },
  DOD: {
    eyebrow: 'Learner discipline',
    title: 'Director of Discipline workspace',
    description: 'Monitor attendance, learner conduct, interventions and discipline follow-up.',
    accent: 'from-slate-950 via-rose-950 to-orange-900',
    tools: [
      { title: 'Attendance monitoring', detail: 'Review attendance and absenteeism follow-up', icon: CalendarCheck, href: '/teacher/attendance' },
      { title: 'Learner conduct', detail: 'Record positive conduct and discipline interventions', icon: ShieldCheck, href: '/teacher/conduct' },
      { title: 'Discipline cases', detail: 'Manage warnings, referrals and case progress', icon: ClipboardCheck },
      { title: 'Discipline reports', detail: 'Review patterns and management summaries', icon: FileBarChart },
    ],
  },
  HOD: {
    eyebrow: 'Department leadership',
    title: 'Head of Department workspace',
    description: 'Monitor teachers, modules and academic delivery within your assigned department.',
    accent: 'from-slate-950 via-emerald-950 to-teal-900',
    tools: [
      { title: 'Department classes', detail: 'Review classes within authorized department scope', icon: School, href: '/teacher/classes' },
      { title: 'Department modules', detail: 'Monitor curriculum and module delivery', icon: BookOpen, href: '/teacher/modules' },
      { title: 'Assessment review', detail: 'Review department assessment activity', icon: ClipboardCheck, href: '/teacher/assessments' },
      { title: 'Department reports', detail: 'Prepare department performance summaries', icon: FileBarChart },
    ],
  },
  PATRON: {
    eyebrow: 'Boarding leadership',
    title: 'Patron welfare workspace',
    description: 'Coordinate boys’ boarding attendance, permissions, dormitory welfare and incident follow-up.',
    accent: 'from-slate-950 via-amber-950 to-orange-900',
    tools: [
      { title: 'Dormitory roll call', detail: 'Record and review boarding attendance', icon: CalendarCheck },
      { title: 'Dormitory oversight', detail: 'Monitor assigned dormitories and student leaders', icon: Building2 },
      { title: 'Student permissions', detail: 'Track authorized boarding movements', icon: ShieldCheck },
      { title: 'Welfare records', detail: 'Record welfare concerns and emergency follow-up', icon: HeartHandshake },
    ],
  },
  MATRON: {
    eyebrow: 'Boarding leadership',
    title: 'Matron welfare workspace',
    description: 'Coordinate girls’ boarding attendance, permissions, dormitory welfare and incident follow-up.',
    accent: 'from-slate-950 via-fuchsia-950 to-rose-900',
    tools: [
      { title: 'Dormitory roll call', detail: 'Record and review boarding attendance', icon: CalendarCheck },
      { title: 'Dormitory oversight', detail: 'Monitor assigned dormitories and student leaders', icon: Building2 },
      { title: 'Student permissions', detail: 'Track authorized boarding movements', icon: ShieldCheck },
      { title: 'Welfare records', detail: 'Record welfare concerns and emergency follow-up', icon: HeartHandshake },
    ],
  },
};

export function PrimaryResponsibilityDashboard({
  roleCode,
  roleLabel,
  firstName,
  departmentCount,
}: {
  roleCode: ResponsibilityCode;
  roleLabel: string;
  firstName?: string;
  departmentCount: number;
}) {
  const workspace = WORKSPACES[roleCode];

  return (
    <div className="space-y-7">
      <section className={`overflow-hidden rounded-3xl bg-gradient-to-r ${workspace.accent} p-6 text-white shadow-xl sm:p-8`}>
        <Badge className="mb-4 border-white/20 bg-white/10 text-white hover:bg-white/10">{roleLabel}</Badge>
        <p className="text-sm font-semibold uppercase tracking-[.18em] text-cyan-200">{workspace.eyebrow}</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight">Welcome, {firstName}</h2>
        <h3 className="mt-2 text-xl font-semibold text-white/90">{workspace.title}</h3>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200">{workspace.description}</p>
        {roleCode === 'HOD' && (
          <p className="mt-5 text-sm font-semibold text-emerald-200">
            Authorized department scope: {departmentCount || 'not configured'}
          </p>
        )}
      </section>

      <section>
        <div className="mb-4">
          <h3 className="text-xl font-bold">Your responsibility tools</h3>
          <p className="text-sm text-muted-foreground">Workspace selected from your current school responsibility</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {workspace.tools.map((tool) => {
            const Icon = tool.icon;
            const content = (
              <Card className="h-full border-slate-200 transition hover:border-cyan-300 hover:shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="rounded-xl bg-slate-100 p-2.5 text-slate-700"><Icon className="size-5" /></div>
                    {tool.href ? <ChevronRight className="size-5 text-slate-300" /> : <Badge variant="outline">Coming soon</Badge>}
                  </div>
                  <h4 className="mt-4 font-bold">{tool.title}</h4>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{tool.detail}</p>
                </CardContent>
              </Card>
            );
            return tool.href ? <Link key={tool.title} href={tool.href}>{content}</Link> : <div key={tool.title}>{content}</div>;
          })}
        </div>
      </section>

      <FeaturedPostsWidget viewAllHref="/teacher/announcements" />
    </div>
  );
}
