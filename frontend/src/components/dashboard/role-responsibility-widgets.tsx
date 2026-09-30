'use client';

import {
  BookOpen,
  Building2,
  ChevronRight,
  ClipboardList,
  GraduationCap,
  HeartHandshake,
  ShieldCheck,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';

type RoleWidget = {
  roleCode: string;
  title: string;
  description: string;
  icon: typeof Building2;
  accent: string;
  actions: Array<{
    label: string;
    href: string;
    permission: string;
  }>;
};

const ROLE_WIDGETS: RoleWidget[] = [
  {
    roleCode: 'HEAD_TEACHER',
    title: 'School leadership',
    description: 'Review school-wide academic structures and curriculum delivery.',
    icon: Building2,
    accent: 'bg-indigo-100 text-indigo-700',
    actions: [
      { label: 'Academic structures', href: '/teacher/classes', permission: 'academic.view' },
      { label: 'Curriculum modules', href: '/teacher/modules', permission: 'academic.curriculum.view' },
    ],
  },
  {
    roleCode: 'DOS',
    title: 'Academic management',
    description: 'Coordinate classes, modules and teaching allocation across the school.',
    icon: GraduationCap,
    accent: 'bg-cyan-100 text-cyan-700',
    actions: [
      { label: 'Classes and trades', href: '/teacher/classes', permission: 'academic.view' },
      { label: 'Teaching modules', href: '/teacher/modules', permission: 'academic.curriculum.view' },
    ],
  },
  {
    roleCode: 'HOD',
    title: 'Department oversight',
    description: 'Monitor curriculum and teaching activity inside assigned departments.',
    icon: Users,
    accent: 'bg-emerald-100 text-emerald-700',
    actions: [
      { label: 'Department classes', href: '/teacher/classes', permission: 'academic.view' },
      { label: 'Department modules', href: '/teacher/modules', permission: 'academic.curriculum.view' },
    ],
  },
  {
    roleCode: 'CLASS_TEACHER',
    title: 'Class teacher',
    description: 'Class-level attendance, progress and learner follow-up workspace.',
    icon: ClipboardList,
    accent: 'bg-blue-100 text-blue-700',
    actions: [],
  },
  {
    roleCode: 'DOD',
    title: 'Discipline leadership',
    description: 'Attendance monitoring, discipline cases and learner permissions.',
    icon: ShieldCheck,
    accent: 'bg-rose-100 text-rose-700',
    actions: [],
  },
  {
    roleCode: 'PATRON',
    title: 'Boarding and welfare',
    description: 'Dormitory roll calls, permissions and learner welfare follow-up.',
    icon: HeartHandshake,
    accent: 'bg-amber-100 text-amber-700',
    actions: [],
  },
  {
    roleCode: 'MATRON',
    title: 'Boarding and welfare',
    description: 'Dormitory roll calls, permissions and learner welfare follow-up.',
    icon: HeartHandshake,
    accent: 'bg-amber-100 text-amber-700',
    actions: [],
  },
];

export function RoleResponsibilityWidgets() {
  const { schoolRoles, hasPermission } = useAuth();
  const assignments = new Map(schoolRoles.map((role) => [role.code, role]));
  const widgets = ROLE_WIDGETS.filter((widget) => assignments.has(widget.roleCode));

  if (!widgets.length) return null;

  return (
    <section aria-labelledby="responsibility-workspace-title">
      <div className="mb-4">
        <h3 id="responsibility-workspace-title" className="text-xl font-bold">
          Responsibility workspace
        </h3>
        <p className="text-sm text-muted-foreground">
          Tools and scope available through your additional school responsibilities
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {widgets.map((widget) => {
          const assignment = assignments.get(widget.roleCode)!;
          const actions = widget.actions.filter((action) => hasPermission(action.permission));
          const Icon = widget.icon;

          return (
            <Card key={widget.roleCode} className="overflow-hidden border-slate-200">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className={`rounded-2xl p-3 ${widget.accent}`}>
                    <Icon className="size-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold">{widget.title}</h4>
                      <Badge variant="secondary">{assignment.label}</Badge>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{widget.description}</p>
                    {assignment.departmentIds.length > 0 && (
                      <p className="mt-2 text-xs font-medium text-emerald-700">
                        Scoped to {assignment.departmentIds.length}{' '}
                        {assignment.departmentIds.length === 1 ? 'department' : 'departments'}
                      </p>
                    )}
                  </div>
                </div>

                {actions.length > 0 ? (
                  <div className="mt-4 grid gap-2 border-t pt-4 sm:grid-cols-2">
                    {actions.map((action) => (
                      <Link
                        key={`${widget.roleCode}-${action.href}`}
                        href={action.href}
                        className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-cyan-50 hover:text-cyan-800"
                      >
                        <span className="flex items-center gap-2">
                          <BookOpen className="size-4" />
                          {action.label}
                        </span>
                        <ChevronRight className="size-4" />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl border border-dashed bg-slate-50 p-3 text-xs leading-5 text-muted-foreground">
                    This responsibility is assigned. Its protected operational workflow will appear here when the corresponding backend permissions are activated.
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
