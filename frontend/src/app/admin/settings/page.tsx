'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { api } from '@/lib/api';
import { ANNOUNCEMENT_CATEGORIES, type AnnouncementCategory } from '@/lib/announcement-constants';
import { LanguageSettings } from '@/components/shared/language-settings';

type VisibilityMap = Record<AnnouncementCategory, boolean>;

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['announcement-category-visibility'],
    queryFn: async () => (await api.get<VisibilityMap>('/announcements/category-visibility')).data,
  });

  const update = useMutation({
    mutationFn: async (categories: Partial<VisibilityMap>) =>
      api.patch('/announcements/category-visibility', { categories }),
    onSuccess: () => {
      toast.success('Setting updated');
      queryClient.invalidateQueries({ queryKey: ['announcement-category-visibility'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-sm text-muted-foreground">Control what parents can see on their dashboard</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Announcement categories visible to parents</CardTitle>
          <CardDescription>
            Turning a category off hides it from the parent dashboard feed. Teachers and admins always
            see everything targeted to them.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {ANNOUNCEMENT_CATEGORIES.map((category) => (
            <div key={category.value} className="flex items-center justify-between">
              <span className="text-sm">{category.label}</span>
              <Switch
                checked={data?.[category.value] ?? true}
                onCheckedChange={(checked) => update.mutate({ [category.value]: checked })}
              />
            </div>
          ))}
        </CardContent>
      </Card>
      <LanguageSettings />
    </div>
  );
}
