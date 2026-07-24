'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { api } from '@/lib/api';

interface ConversationSummary {
  id: string;
  status: 'OPEN' | 'RESOLVED';
  updatedAt: string;
  user: { id: string; firstName: string; lastName: string; role: string };
  lastMessage: { content: string | null; createdAt: string; senderId: string } | null;
  unreadCount: number;
}

export default function AdminMessagesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-conversations'],
    queryFn: async () => (await api.get<ConversationSummary[]>('/messages/conversations')).data,
    refetchInterval: 15000,
  });

  const columns: DataTableColumn<ConversationSummary>[] = [
    {
      header: 'From',
      cell: (row) => (
        <Link href={`/admin/messages/${row.id}`} className="font-medium hover:underline">
          {row.user.firstName} {row.user.lastName}
        </Link>
      ),
    },
    { header: 'Role', cell: (row) => <Badge variant="outline">{row.user.role}</Badge> },
    {
      header: 'Last message',
      cell: (row) => (
        <span className="line-clamp-1 max-w-xs text-muted-foreground">
          {row.lastMessage?.content ?? (row.lastMessage ? '(attachment)' : '—')}
        </span>
      ),
    },
    {
      header: 'Updated',
      cell: (row) => new Date(row.updatedAt).toLocaleString(),
    },
    {
      header: 'Status',
      cell: (row) => (
        <Badge variant={row.status === 'OPEN' ? 'default' : 'secondary'}>{row.status}</Badge>
      ),
    },
    {
      header: '',
      className: 'text-right',
      cell: (row) =>
        row.unreadCount > 0 ? (
          <Badge variant="destructive">{row.unreadCount} new</Badge>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Messages</h2>
        <p className="text-sm text-muted-foreground">Conversations with parents and teachers</p>
      </div>
      <DataTable columns={columns} data={data ?? []} isLoading={isLoading} getRowKey={(row) => row.id} />
    </div>
  );
}
