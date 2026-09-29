'use client';

import { use } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageThread } from '@/components/shared/message-thread';
import { api } from '@/lib/api';

interface ConversationHeader {
  status: 'OPEN' | 'RESOLVED';
  user: { firstName: string; lastName: string; role: string };
}

export default function AdminConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['admin-conversation', id],
    queryFn: async () => (await api.get<ConversationHeader>(`/messages/conversations/${id}`)).data,
    refetchInterval: 10000,
  });

  const toggleStatus = useMutation({
    mutationFn: async () =>
      api.patch(`/messages/conversations/${id}/status`, {
        status: data?.status === 'OPEN' ? 'RESOLVED' : 'OPEN',
      }),
    onSuccess: () => {
      toast.success('Status updated');
      queryClient.invalidateQueries({ queryKey: ['admin-conversation', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-conversations'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="space-y-4">
      <Link
        href="/admin/messages"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to messages
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight">
            {data ? `${data.user.firstName} ${data.user.lastName}` : 'Conversation'}
          </h2>
          {data && <Badge variant="outline">{data.user.role}</Badge>}
        </div>
        {data && (
          <Button variant="outline" onClick={() => toggleStatus.mutate()} disabled={toggleStatus.isPending}>
            Mark as {data.status === 'OPEN' ? 'Resolved' : 'Open'}
          </Button>
        )}
      </div>

      <MessageThread
        fetchUrl={`/messages/conversations/${id}`}
        postUrl={`/messages/conversations/${id}`}
        queryKey={['admin-conversation', id]}
      />
    </div>
  );
}
