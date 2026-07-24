'use client';

import { AnnouncementEditor } from '@/components/shared/announcement-editor';

export default function NewAnnouncementPage() {
  return <AnnouncementEditor basePath="/admin/announcements" listQueryKey={['admin-announcements']} />;
}
