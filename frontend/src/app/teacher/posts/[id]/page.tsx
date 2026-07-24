'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AnnouncementEditor } from '@/components/shared/announcement-editor';
import { useAuth } from '@/contexts/auth-context';

export default function TeacherPostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user?.staffTitle) {
      router.replace('/teacher/dashboard');
    }
  }, [isLoading, user, router]);

  if (!user?.staffTitle) {
    return null;
  }

  return <AnnouncementEditor id={id} basePath="/teacher/posts" listQueryKey={['teacher-posts']} />;
}
