'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { api } from '@/lib/api';
import { CATEGORY_LABEL, type AnnouncementCategory } from '@/lib/announcement-constants';

interface AdminAnnouncement {
  id: string;
  title: string;
  type: AnnouncementCategory;
  isPublished: boolean;
  createdAt: string;
  author: { firstName: string; lastName: string };
  _count: { comments: number; reactions: number; attachments: number };
}

export default function AdminAnnouncementsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-announcements'],
    queryFn: async () => (await api.get<AdminAnnouncement[]>('/announcements')).data,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => api.delete(`/announcements/${id}`),
    onSuccess: () => {
      toast.success('Announcement removed');
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const columns: DataTableColumn<AdminAnnouncement>[] = [
    {
      header: 'Title',
      cell: (row) => (
        <Link href={`/admin/announcements/${row.id}`} className="font-medium hover:underline">
          {row.title}
        </Link>
      ),
    },
    { header: 'Category', cell: (row) => <Badge variant="secondary">{CATEGORY_LABEL[row.type]}</Badge> },
    {
      header: 'Status',
      cell: (row) => <Badge variant={row.isPublished ? 'default' : 'secondary'}>{row.isPublished ? 'Published' : 'Draft'}</Badge>,
    },
    { header: 'Author', cell: (row) => `${row.author.firstName} ${row.author.lastName}` },
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
          <h2 className="text-2xl font-bold tracking-tight">Announcements</h2>
          <p className="text-sm text-muted-foreground">Post updates shared with parents and teachers</p>
        </div>
        <Button asChild>
          <Link href="/admin/announcements/new">
            <Plus className="size-4" />
            New Announcement
          </Link>
        </Button>
      </div>

      <DataTable columns={columns} data={data ?? []} isLoading={isLoading} getRowKey={(row) => row.id} />
    </div>
  );
}
