'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowRight, BookOpen, CalendarCheck, ClipboardCheck, FileQuestion, GraduationCap, Library, School, ShieldCheck, Sparkles, TrendingUp, Users } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FeaturedPostsWidget } from '@/components/shared/featured-posts-widget';
import { PrimaryResponsibilityDashboard } from '@/components/dashboard/primary-responsibility-dashboard';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';

interface Assignment { id: string; class: { id: string; name: string; level: string; section: string | null }; subject: { id: string; code: string; name: string; credits: number | null; learningHours?: number | null } }

const tools = [
  { title: 'Take attendance', detail: 'Record daily class attendance', href: '/teacher/attendance', icon: CalendarCheck, color: 'bg-emerald-500' },
  { title: 'Assessments & exams', detail: 'Plan quizzes, assignments and exams', href: '/teacher/assessments', icon: ClipboardCheck, color: 'bg-violet-500' },
  { title: 'Marks management', detail: 'Enter and review term results', href: '/teacher/marks', icon: TrendingUp, color: 'bg-cyan-600' },
  { title: 'Question bank', detail: 'Build reusable question collections', href: '/teacher/question-bank', icon: FileQuestion, color: 'bg-amber-500' },
  { title: 'Notes & manuals', detail: 'Organise learning resources', href: '/teacher/resources', icon: Library, color: 'bg-blue-600' },
  { title: 'Student conduct', detail: 'Recognise good conduct and record cases', href: '/teacher/conduct', icon: ShieldCheck, color: 'bg-rose-500' },
];

export default function TeacherDashboardPage() {
  const { user, schoolRoles, isLoading: authLoading } = useAuth();
  const primaryRole = schoolRoles.find((role) => ['HEAD_TEACHER', 'DOS', 'DOD', 'HOD', 'PATRON', 'MATRON'].includes(role.code));
  const isTeacherWorkspace = !primaryRole;
  const { data = [], isLoading } = useQuery({ queryKey: ['teacher-assignments'], enabled: !authLoading && isTeacherWorkspace, queryFn: async () => (await api.get<Assignment[]>('/teachers/me/assignments')).data });

  if (authLoading) return <p className="text-sm text-muted-foreground">Loading your responsibility workspace…</p>;
  if (primaryRole) {
    return <PrimaryResponsibilityDashboard
      roleCode={primaryRole.code as 'HEAD_TEACHER' | 'DOS' | 'DOD' | 'HOD' | 'PATRON' | 'MATRON'}
      roleLabel={primaryRole.label}
      firstName={user?.firstName}
      departmentCount={primaryRole.departmentIds.length}
    />;
  }
  const classes = new Set(data.map((item) => item.class.id)).size;
  const stats = [
    { label: 'Assigned classes', value: classes, icon: School },
    { label: 'Teaching modules', value: data.length, icon: BookOpen },
    { label: 'Active learners', value: '—', icon: Users },
    { label: 'Current term', value: 'Term 1', icon: GraduationCap },
  ];
  return <div className="space-y-7">
    <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-blue-950 to-cyan-900 p-6 text-white shadow-xl sm:p-8">
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center"><div className="max-w-2xl"><div className="mb-3 flex items-center gap-2 text-sm font-semibold text-cyan-200"><Sparkles className="size-4" /> Teacher command centre</div><h2 className="text-3xl font-bold tracking-tight">Welcome back, {user?.firstName}</h2><p className="mt-2 text-sm leading-6 text-slate-200">Manage your classes, teaching modules, assessments, learner progress and classroom conduct from one professional workspace.</p></div><Button asChild className="bg-white text-blue-950 hover:bg-cyan-50"><Link href="/teacher/attendance"><CalendarCheck /> Take today&apos;s attendance</Link></Button></div>
      <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">{stats.map(({ label, value, icon: StatIcon }) => <div key={label} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm"><StatIcon className="mb-3 size-5 text-cyan-300" /><div className="text-2xl font-bold">{isLoading ? '…' : String(value)}</div><div className="text-xs text-slate-300">{label}</div></div>)}</div>
    </section>
    <section><div className="mb-4"><h3 className="text-xl font-bold">Teaching tools</h3><p className="text-sm text-muted-foreground">Everything needed for the teaching and assessment cycle</p></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{tools.map((tool) => <Link key={tool.href} href={tool.href} className="group"><Card className="h-full border-slate-200 transition hover:-translate-y-1 hover:border-cyan-300 hover:shadow-lg"><CardContent className="flex items-center gap-4 p-5"><div className={`rounded-2xl p-3 text-white shadow ${tool.color}`}><tool.icon className="size-6" /></div><div className="min-w-0 flex-1"><h4 className="font-semibold">{tool.title}</h4><p className="mt-1 text-xs text-muted-foreground">{tool.detail}</p></div><ArrowRight className="size-5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-cyan-600" /></CardContent></Card></Link>)}</div></section>
    <section className="grid gap-5 xl:grid-cols-[1.4fr_.8fr]"><Card><CardContent className="p-6"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-bold">My teaching allocation</h3><p className="text-sm text-muted-foreground">Classes, trades and modules assigned to you</p></div><Button asChild variant="outline" size="sm"><Link href="/teacher/classes">View all</Link></Button></div><div className="space-y-3">{isLoading ? <p className="text-sm text-muted-foreground">Loading allocation…</p> : data.length ? data.slice(0, 5).map((item) => <div key={item.id} className="flex items-center gap-4 rounded-xl border bg-slate-50 p-4"><div className="rounded-lg bg-blue-100 p-2 text-blue-700"><BookOpen className="size-5" /></div><div className="min-w-0 flex-1"><p className="truncate font-semibold">{item.subject.name}</p><p className="text-xs text-muted-foreground">{item.class.name}{item.class.section ? ` • ${item.class.section}` : ''}</p></div><Badge variant="outline">{item.subject.code}</Badge></div>) : <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">No classes or modules have been assigned yet.</div>}</div></CardContent></Card><FeaturedPostsWidget viewAllHref="/teacher/announcements" /></section>
  </div>;
}
