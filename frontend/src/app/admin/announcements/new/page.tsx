'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AnnouncementForm,
  defaultAnnouncementFormValues,
  type AnnouncementFormValues,
} from '@/components/shared/announcement-form';
import { api } from '@/lib/api';

export default function NewAnnouncementPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: async (values: AnnouncementFormValues) =>
      (
        await api.post<{ id: string }>('/announcements', {
          ...values,
          expiresAt: values.expiresAt || undefined,
        })
      ).data,
    onSuccess: (data) => {
      toast.success('Announcement created');
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      router.push(`/admin/announcements/${data.id}`);
    },
    onError: (error: Error) => toast.error(error.message),
  });

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
          <CardTitle>New Announcement</CardTitle>
        </CardHeader>
        <CardContent>
          <AnnouncementForm
            defaultValues={defaultAnnouncementFormValues}
            onSubmit={(values) => create.mutate(values)}
            isSubmitting={create.isPending}
            submitLabel="Create announcement"
          />
        </CardContent>
      </Card>
    </div>
  );
}
