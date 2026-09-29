'use client';

import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Paperclip, Send, X } from 'lucide-react';
import { toast } from 'sonner';
import { AttachmentPreview, type AttachmentLike } from '@/components/shared/attachment-preview';
import { VoiceRecorderButton } from '@/components/shared/voice-recorder-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';
import { ATTACHMENT_ACCEPT, MAX_FILE_SIZE_LABEL, isFileTooLarge } from '@/lib/attachment-limits';
import { cn } from '@/lib/utils';

interface MessageSender {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface MessageItem {
  id: string;
  content: string | null;
  createdAt: string;
  sender: MessageSender;
  attachments: AttachmentLike[];
}

interface ConversationData {
  id: string;
  status: 'OPEN' | 'RESOLVED';
  messages: MessageItem[];
}

export function MessageThread({
  fetchUrl,
  postUrl,
  queryKey,
}: {
  fetchUrl: string;
  postUrl: string;
  queryKey: string[];
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery<ConversationData>({
    queryKey,
    queryFn: async () => (await api.get<ConversationData>(fetchUrl)).data,
    refetchInterval: 10000,
  });

  const send = useMutation({
    mutationFn: async (voiceFile?: File) => {
      const formData = new FormData();
      if (content.trim()) formData.append('content', content.trim());
      pendingFiles.forEach((file) => formData.append('files', file));
      if (voiceFile) formData.append('files', voiceFile);
      return api.post(postUrl, formData);
    },
    onSuccess: () => {
      setContent('');
      setPendingFiles([]);
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const canSend = content.trim().length > 0 || pendingFiles.length > 0;

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  return (
    <div className="flex h-[calc(100dvh-220px)] min-h-80 min-w-0 flex-col rounded-md border">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {data?.messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">No messages yet. Say hello!</p>
        )}
        {data?.messages.map((message) => {
          const isMine = message.sender.id === user?.id;
          return (
            <div key={message.id} className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'min-w-0 max-w-[90%] wrap-anywhere sm:max-w-[75%] space-y-2 rounded-lg px-3 py-2 text-sm',
                  isMine ? 'bg-primary text-primary-foreground' : 'bg-secondary',
                )}
              >
                {!isMine && (
                  <p className="text-xs font-medium opacity-70">
                    {message.sender.firstName} {message.sender.lastName}
                  </p>
                )}
                {message.content && <p className="whitespace-pre-wrap">{message.content}</p>}
                {message.attachments.length > 0 && (
                  <div className="space-y-2">
                    {message.attachments.map((attachment) => (
                      <AttachmentPreview key={attachment.id} attachment={attachment} className="max-w-56" />
                    ))}
                  </div>
                )}
                <p className="text-[10px] opacity-60">{new Date(message.createdAt).toLocaleString()}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-2 border-t p-3">
        {pendingFiles.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {pendingFiles.map((file, index) => (
              <span
                key={`${file.name}-${index}`}
                className="flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs"
              >
                {file.name}
                <button
                  type="button"
                  onClick={() => setPendingFiles((files) => files.filter((_, i) => i !== index))}
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ATTACHMENT_ACCEPT}
            className="hidden"
            onChange={(event) => {
              const files = event.target.files;
              if (files) {
                const accepted: File[] = [];
                for (const file of Array.from(files)) {
                  if (isFileTooLarge(file)) {
                    toast.error(`${file.name} is larger than ${MAX_FILE_SIZE_LABEL} and was skipped`);
                    continue;
                  }
                  accepted.push(file);
                }
                setPendingFiles((current) => [...current, ...accepted]);
              }
              event.target.value = '';
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            title="Attach a file"
          >
            <Paperclip className="size-4" />
          </Button>
          <VoiceRecorderButton
            onRecorded={(file) => {
              if (isFileTooLarge(file)) {
                toast.error(`Voice note is larger than ${MAX_FILE_SIZE_LABEL}`);
                return;
              }
              send.mutate(file);
            }}
          />
          <Input
            className="order-first w-full sm:order-none sm:w-auto sm:flex-1"
            aria-label="Message"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Type a message…"
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                if (canSend) send.mutate(undefined);
              }
            }}
          />
          <Button
            type="button"
            size="icon"
            aria-label="Send message"
            onClick={() => send.mutate(undefined)}
            disabled={send.isPending || !canSend}
          >
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
