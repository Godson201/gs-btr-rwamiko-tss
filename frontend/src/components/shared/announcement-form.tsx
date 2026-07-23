'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ANNOUNCEMENT_CATEGORIES, type AnnouncementCategory } from '@/lib/announcement-constants';

const AUDIENCE_OPTIONS: { value: 'PARENT' | 'TEACHER' | 'STUDENT'; label: string }[] = [
  { value: 'PARENT', label: 'Parents' },
  { value: 'TEACHER', label: 'Teachers' },
  { value: 'STUDENT', label: 'Students' },
];

export const announcementFormSchema = z.object({
  title: z.string().min(1, 'Required'),
  content: z.string().min(1, 'Required'),
  type: z.enum([
    'GENERAL',
    'ACADEMIC',
    'FEES_FINANCE',
    'REGISTRATION',
    'EVENT_ACTIVITY',
    'DISCIPLINE',
    'SAFETY_ALERT',
    'EMERGENCY',
  ]),
  targetAudience: z.array(z.enum(['PARENT', 'TEACHER', 'STUDENT'])).min(1, 'Select at least one audience'),
  isPublished: z.boolean(),
  expiresAt: z.string().optional(),
});

export type AnnouncementFormValues = z.infer<typeof announcementFormSchema>;

export const defaultAnnouncementFormValues: AnnouncementFormValues = {
  title: '',
  content: '',
  type: 'GENERAL',
  targetAudience: ['PARENT', 'TEACHER'],
  isPublished: true,
  expiresAt: '',
};

export function AnnouncementForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  submitLabel,
}: {
  defaultValues: AnnouncementFormValues;
  onSubmit: (values: AnnouncementFormValues) => void;
  isSubmitting: boolean;
  submitLabel: string;
}) {
  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementFormSchema),
    defaultValues,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Term 2 School Fees Reminder" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content</FormLabel>
              <FormControl>
                <textarea
                  {...field}
                  rows={6}
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select value={field.value} onValueChange={(value) => field.onChange(value as AnnouncementCategory)}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {ANNOUNCEMENT_CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="targetAudience"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Audience</FormLabel>
              <div className="flex gap-4">
                {AUDIENCE_OPTIONS.map((option) => (
                  <label key={option.value} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={field.value.includes(option.value)}
                      onChange={(event) => {
                        field.onChange(
                          event.target.checked
                            ? [...field.value, option.value]
                            : field.value.filter((v) => v !== option.value),
                        );
                      }}
                      className="size-4 rounded border-input"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="expiresAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expires on (optional)</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="isPublished"
            render={({ field }) => (
              <FormItem className="flex flex-col justify-end gap-2">
                <FormLabel>Published</FormLabel>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : submitLabel}
        </Button>
      </form>
    </Form>
  );
}
