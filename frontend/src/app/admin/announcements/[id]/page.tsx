'use client';

import { use } from 'react';
import { AnnouncementEditor } from '@/components/shared/announcement-editor';

export default function AnnouncementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <AnnouncementEditor id={id} basePath="/admin/announcements" listQueryKey={['admin-announcements']} />;
}
