'use client';

import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';
import { CATEGORY_LABEL, type AnnouncementCategory } from '@/lib/announcement-constants';

interface TeacherPost {
  id: string;
  title: string;
  type: AnnouncementCategory;
  isPublished: boolean;
  isFeatured: boolean;
  createdAt: string;
  _count: { comments: number; reactions: number; attachments: number };
}

export default function TeacherPostsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!authLoading && !user?.staffTitle) {
      router.replace('/teacher/dashboard');
    }
  }, [authLoading, user, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['teacher-posts'],
    queryFn: async () => (await api.get<TeacherPost[]>('/announcements')).data,
    enabled: Boolean(user?.staffTitle),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => api.delete(`/announcements/${id}`),
    onSuccess: () => {
      toast.success('Post removed');
      queryClient.invalidateQueries({ queryKey: ['teacher-posts'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!user?.staffTitle) {
    return null;
  }

  const columns: DataTableColumn<TeacherPost>[] = [
    {
      header: 'Title',
      cell: (row) => (
        <Link href={`/teacher/posts/${row.id}`} className="font-medium hover:underline">
          {row.title}
        </Link>
      ),
    },
    { header: 'Category', cell: (row) => <Badge variant="secondary">{CATEGORY_LABEL[row.type]}</Badge> },
    {
      header: 'Status',
      cell: (row) => (
        <div className="flex gap-1">
          <Badge variant={row.isPublished ? 'default' : 'secondary'}>{row.isPublished ? 'Published' : 'Draft'}</Badge>
          {row.isFeatured && <Badge variant="outline">Featured</Badge>}
        </div>
      ),
    },
    {
      header: 'Engagement',
      cell: (row) => `${row._count.comments} comments · ${row._count.reactions} reactions · ${row._count.attachments} media`,
    },
    {
      header: '',
      className: 'text-right',
      cell: (row) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (confirm(`Delete "${row.title}"? This cannot be undone.`)) {
              remove.mutate(row.id);
            }
          }}
        >
          <Trash2 className="size-4 text-destructive" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">School Posts</h2>
          <p className="text-sm text-muted-foreground">Publish school-wide posts shown on every dashboard</p>
        </div>
        <Button asChild>
          <Link href="/teacher/posts/new">
            <Plus className="size-4" />
            New Post
          </Link>
        </Button>
      </div>

      <DataTable columns={columns} data={data ?? []} isLoading={isLoading} getRowKey={(row) => row.id} />
    </div>
  );
}
