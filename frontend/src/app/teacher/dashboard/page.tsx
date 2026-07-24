'use client';

import { useQuery } from '@tanstack/react-query';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { FeaturedPostsWidget } from '@/components/shared/featured-posts-widget';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';

interface Assignment {
  id: string;
  class: { id: string; name: string; level: string; section: string | null };
  subject: { id: string; code: string; name: string; credits: number | null };
}

export default function TeacherDashboardPage() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['teacher-assignments'],
    queryFn: async () => (await api.get<Assignment[]>('/teachers/me/assignments')).data,
  });

  const columns: DataTableColumn<Assignment>[] = [
    {
      header: 'Class',
      cell: (row) => `${row.class.name}${row.class.section ? ` - ${row.class.section}` : ''}`,
    },
    {
      header: 'Module',
      cell: (row) => (
        <div>
          <div className="font-medium">{row.subject.name}</div>
          <div className="text-xs text-muted-foreground">{row.subject.code}</div>
        </div>
      ),
    },
    { header: 'Credits', cell: (row) => row.subject.credits ?? '—' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Welcome, {user?.firstName}</h2>
        <p className="text-sm text-muted-foreground">Your assigned classes and modules</p>
      </div>
      <FeaturedPostsWidget viewAllHref="/teacher/announcements" />
      <DataTable
        columns={columns}
        data={data ?? []}
        isLoading={isLoading}
        getRowKey={(row) => row.id}
        emptyMessage="No classes or modules assigned to you yet."
      />
    </div>
  );
}
