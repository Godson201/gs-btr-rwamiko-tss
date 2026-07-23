'use client';

import { use, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Trash2, Upload } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AnnouncementForm,
  type AnnouncementFormValues,
} from '@/components/shared/announcement-form';
import { api } from '@/lib/api';
import type { AnnouncementCategory } from '@/lib/announcement-constants';

const UPLOADS_BASE_URL = process.env.NEXT_PUBLIC_UPLOADS_BASE_URL ?? '';

interface Attachment {
  id: string;
  url: string;
  type: 'IMAGE' | 'VIDEO';
  filename: string;
}

interface AnnouncementDetail {
  id: string;
  title: string;
  content: string;
  type: AnnouncementCategory;
  targetAudience: ('PARENT' | 'TEACHER' | 'STUDENT' | 'ADMIN' | 'SUPER_ADMIN')[];
  isPublished: boolean;
  expiresAt: string | null;
  attachments: Attachment[];
}

export default function AnnouncementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [files, setFiles] = useState<FileList | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['announcement', id],
    queryFn: async () => (await api.get<AnnouncementDetail>(`/announcements/${id}`)).data,
  });

  const update = useMutation({
    mutationFn: async (values: AnnouncementFormValues) =>
      api.patch(`/announcements/${id}`, { ...values, expiresAt: values.expiresAt || undefined }),
    onSuccess: () => {
      toast.success('Announcement updated');
      queryClient.invalidateQueries({ queryKey: ['announcement', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const uploadAttachments = useMutation({
    mutationFn: async () => {
      if (!files?.length) throw new Error('Choose at least one file first');
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append('files', file));
      return api.post(`/announcements/${id}/attachments`, formData);
    },
    onSuccess: () => {
      toast.success('Media uploaded');
      setFiles(null);
      queryClient.invalidateQueries({ queryKey: ['announcement', id] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const removeAttachment = useMutation({
    mutationFn: async (attachmentId: string) =>
      api.delete(`/announcements/${id}/attachments/${attachmentId}`),
    onSuccess: () => {
      toast.success('Attachment removed');
      queryClient.invalidateQueries({ queryKey: ['announcement', id] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (isLoading || !data) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  const defaultValues: AnnouncementFormValues = {
    title: data.title,
    content: data.content,
    type: data.type,
    targetAudience: data.targetAudience.filter(
      (role): role is 'PARENT' | 'TEACHER' | 'STUDENT' =>
        role === 'PARENT' || role === 'TEACHER' || role === 'STUDENT',
    ),
    isPublished: data.isPublished,
    expiresAt: data.expiresAt ? data.expiresAt.slice(0, 10) : '',
  };

  return (
    <div className="max-w-2xl space-y-6">
      <Link
        href="/admin/announcements"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to announcements
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Edit Announcement</CardTitle>
        </CardHeader>
        <CardContent>
          <AnnouncementForm
            defaultValues={defaultValues}
            onSubmit={(values) => update.mutate(values)}
            isSubmitting={update.isPending}
            submitLabel="Save changes"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Media</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.attachments.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {data.attachments.map((attachment) => (
                <div key={attachment.id} className="relative">
                  {attachment.type === 'IMAGE' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`${UPLOADS_BASE_URL}${attachment.url}`}
                      alt={attachment.filename}
                      className="aspect-video w-full rounded-md object-cover"
                    />
                  ) : (
                    <video
                      src={`${UPLOADS_BASE_URL}${attachment.url}`}
                      controls
                      className="aspect-video w-full rounded-md"
                    />
                  )}
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 size-6"
                    onClick={() => removeAttachment.mutate(attachment.id)}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={(event) => setFiles(event.target.files)}
              className="flex-1 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1 file:text-sm"
            />
            <Button
              onClick={() => uploadAttachments.mutate()}
              disabled={!files?.length || uploadAttachments.isPending}
            >
              <Upload className="size-4" />
              {uploadAttachments.isPending ? 'Uploading…' : 'Upload'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
