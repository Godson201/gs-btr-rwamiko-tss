'use client';

import { useQuery } from '@tanstack/react-query';
import { GraduationCap, School, UserRound, Users } from 'lucide-react';
import { FeaturedPostsWidget } from '@/components/shared/featured-posts-widget';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ActivityLogs } from '@/components/admin/activity-logs';
import { api } from '@/lib/api';

interface DashboardStats {
  studentCount: number;
  teacherCount: number;
  parentCount: number;
  classCount: number;
}

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => (await api.get<DashboardStats>('/dashboard/stats')).data,
  });

  const cards = [
    { label: 'Students', value: data?.studentCount, icon: GraduationCap },
    { label: 'Teachers', value: data?.teacherCount, icon: Users },
    { label: 'Parents', value: data?.parentCount, icon: UserRound },
    { label: 'Classes', value: data?.classCount, icon: School },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-sm text-muted-foreground">Overview of G.S BTR RWAMIKO TSS</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
              <card.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? '…' : (card.value ?? 0)}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <ActivityLogs compact />
      <FeaturedPostsWidget viewAllHref="/admin/announcements" />
    </div>
  );
}
