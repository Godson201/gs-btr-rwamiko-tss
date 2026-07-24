'use client';

import { useQuery } from '@tanstack/react-query';
import { GraduationCap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FeaturedPostsWidget } from '@/components/shared/featured-posts-widget';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';

interface Child {
  id: string;
  admissionNo: string;
  academicYear: string;
  user: { firstName: string; lastName: string; email: string };
  class: { id: string; name: string; level: string; section: string | null } | null;
}

export default function ParentDashboardPage() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['parent-children'],
    queryFn: async () => (await api.get<Child[]>('/parents/me/children')).data,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Welcome, {user?.firstName}</h2>
        <p className="text-sm text-muted-foreground">Your linked children</p>
      </div>

      <FeaturedPostsWidget viewAllHref="/parent/announcements" />

      {!isLoading && data && data.length === 0 && (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            No children are linked to your account yet. Please contact the school office to link
            your child&apos;s record to your parent account.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((child) => (
          <Card key={child.id}>
            <CardHeader className="flex flex-row items-center gap-3 space-y-0">
              <GraduationCap className="size-8 text-primary" />
              <div>
                <CardTitle className="text-base">
                  {child.user.firstName} {child.user.lastName}
                </CardTitle>
                <p className="text-xs text-muted-foreground">{child.admissionNo}</p>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                Class:{' '}
                {child.class
                  ? `${child.class.name}${child.class.section ? ` - ${child.class.section}` : ''}`
                  : 'Unassigned'}
              </p>
              <p>Academic year: {child.academicYear}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
