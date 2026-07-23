'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';
import {
  CATEGORY_LABEL,
  REACTIONS,
  type AnnouncementCategory,
  type ReactionType,
} from '@/lib/announcement-constants';
import { cn } from '@/lib/utils';

const UPLOADS_BASE_URL = process.env.NEXT_PUBLIC_UPLOADS_BASE_URL ?? '';

interface Attachment {
  id: string;
  url: string;
  type: 'IMAGE' | 'VIDEO';
  filename: string;
}

interface CommentAuthor {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: CommentAuthor;
}

interface FeedItem {
  id: string;
  title: string;
  content: string;
  type: AnnouncementCategory;
  publishedAt: string | null;
  createdAt: string;
  author: { firstName: string; lastName: string };
  attachments: Attachment[];
  comments: Comment[];
  myReaction: ReactionType | null;
  reactionCounts: Record<ReactionType, number>;
}

function CommentBox({ announcementId, comments }: { announcementId: string; comments: Comment[] }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');

  const addComment = useMutation({
    mutationFn: async () => api.post(`/announcements/${announcementId}/comments`, { content }),
    onSuccess: () => {
      setContent('');
      queryClient.invalidateQueries({ queryKey: ['announcements-feed'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const removeComment = useMutation({
    mutationFn: async (commentId: string) =>
      api.delete(`/announcements/${announcementId}/comments/${commentId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['announcements-feed'] }),
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="space-y-3 border-t pt-3">
      {comments.map((comment) => (
        <div key={comment.id} className="flex items-start justify-between gap-2 text-sm">
          <div>
            <span className="font-medium">
              {comment.author.firstName} {comment.author.lastName}
            </span>{' '}
            <span className="text-muted-foreground">{comment.content}</span>
          </div>
          {(comment.author.id === user?.id || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
            <Button
              variant="ghost"
              size="icon"
              className="size-6 shrink-0"
              onClick={() => removeComment.mutate(comment.id)}
            >
              <Trash2 className="size-3 text-destructive" />
            </Button>
          )}
        </div>
      ))}
      <div className="flex gap-2">
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Write a comment…"
          rows={1}
          className="flex-1 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
        />
        <Button
          size="sm"
          disabled={!content.trim() || addComment.isPending}
          onClick={() => addComment.mutate()}
        >
          Post
        </Button>
      </div>
    </div>
  );
}

function ReactionBar({ item }: { item: FeedItem }) {
  const queryClient = useQueryClient();

  const react = useMutation({
    mutationFn: async (type: ReactionType) =>
      api.put(`/announcements/${item.id}/reactions`, { type }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['announcements-feed'] }),
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="flex flex-wrap gap-1 border-t pt-3">
      {REACTIONS.map((reaction) => {
        const count = item.reactionCounts[reaction.value] ?? 0;
        const isMine = item.myReaction === reaction.value;
        return (
          <button
            key={reaction.value}
            type="button"
            onClick={() => react.mutate(reaction.value)}
            className={cn(
              'flex items-center gap-1 rounded-full border px-2 py-1 text-xs transition-colors hover:bg-accent',
              isMine && 'border-primary bg-primary/10 font-medium',
            )}
          >
            <span>{reaction.emoji}</span>
            {count > 0 && <span>{count}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function AnnouncementFeed() {
  const { data, isLoading } = useQuery<FeedItem[]>({
    queryKey: ['announcements-feed'],
    queryFn: async () => (await api.get<FeedItem[]>('/announcements/feed')).data,
  });

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading announcements…</p>;
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          No announcements right now. Check back later.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {data.map((item) => (
        <Card key={item.id}>
          <CardHeader className="space-y-2">
            <div className="flex items-center justify-between">
              <Badge variant="secondary">{CATEGORY_LABEL[item.type]}</Badge>
              <span className="text-xs text-muted-foreground">
                {new Date(item.publishedAt ?? item.createdAt).toLocaleDateString()}
              </span>
            </div>
            <h3 className="text-lg font-semibold">{item.title}</h3>
            <p className="text-xs text-muted-foreground">
              By {item.author.firstName} {item.author.lastName}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="whitespace-pre-wrap text-sm">{item.content}</p>
            {item.attachments.length > 0 && (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {item.attachments.map((attachment) =>
                  attachment.type === 'IMAGE' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={attachment.id}
                      src={`${UPLOADS_BASE_URL}${attachment.url}`}
                      alt={attachment.filename}
                      className="aspect-video w-full rounded-md object-cover"
                    />
                  ) : (
                    <video
                      key={attachment.id}
                      src={`${UPLOADS_BASE_URL}${attachment.url}`}
                      controls
                      className="aspect-video w-full rounded-md"
                    />
                  ),
                )}
              </div>
            )}
            <ReactionBar item={item} />
            <CommentBox announcementId={item.id} comments={item.comments} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
