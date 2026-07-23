'use client';

import { use, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { api } from '@/lib/api';

interface SchoolClass {
  id: string;
  name: string;
  level: string;
  section: string | null;
  academicYear: { name: string };
  _count: { students: number };
}

interface CourseModule {
  id: string;
  code: string;
  name: string;
}

interface Teacher {
  id: string;
  user: { firstName: string; lastName: string };
}

interface Assignment {
  id: string;
  subject: { id: string; code: string; name: string; credits: number | null };
  teacher: { id: string; user: { firstName: string; lastName: string } } | null;
}

const assignSchema = z.object({
  subjectId: z.string().min(1, 'Select a module'),
  teacherId: z.string().optional(),
});

type AssignFormValues = z.infer<typeof assignSchema>;

const UNASSIGNED = '__unassigned__';

export default function ClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: schoolClass } = useQuery({
    queryKey: ['classes', id],
    queryFn: async () => (await api.get<SchoolClass>(`/classes/${id}`)).data,
  });

  const { data: assignments, isLoading } = useQuery({
    queryKey: ['class-modules', id],
    queryFn: async () => (await api.get<Assignment[]>(`/classes/${id}/modules`)).data,
  });

  const { data: modules } = useQuery({
    queryKey: ['modules-options'],
    queryFn: async () => (await api.get<CourseModule[]>('/modules')).data,
  });

  const { data: teachers } = useQuery({
    queryKey: ['teachers-options'],
    queryFn: async () => (await api.get<{ data: Teacher[] }>('/teachers')).data.data,
  });

  const form = useForm<AssignFormValues>({
    resolver: zodResolver(assignSchema),
    defaultValues: { subjectId: '', teacherId: undefined },
  });

  const assignModule = useMutation({
    mutationFn: async (values: AssignFormValues) =>
      api.post(`/classes/${id}/modules`, {
        subjectId: values.subjectId,
        teacherId: values.teacherId,
      }),
    onSuccess: () => {
      toast.success('Module assigned');
      queryClient.invalidateQueries({ queryKey: ['class-modules', id] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const reassignTeacher = useMutation({
    mutationFn: async ({ assignmentId, teacherId }: { assignmentId: string; teacherId: string | null }) =>
      api.patch(`/classes/${id}/modules/${assignmentId}`, { teacherId }),
    onSuccess: () => {
      toast.success('Teacher updated');
      queryClient.invalidateQueries({ queryKey: ['class-modules', id] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const removeAssignment = useMutation({
    mutationFn: async (assignmentId: string) => api.delete(`/classes/${id}/modules/${assignmentId}`),
    onSuccess: () => {
      toast.success('Module removed from class');
      queryClient.invalidateQueries({ queryKey: ['class-modules', id] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const columns: DataTableColumn<Assignment>[] = [
    {
      header: 'Module',
      cell: (row) => (
        <div>
          <div className="font-medium">{row.subject.name}</div>
          <div className="text-xs text-muted-foreground">{row.subject.code}</div>
        </div>
      ),
    },
    {
      header: 'Teacher',
      cell: (row) => (
        <Select
          value={row.teacher?.id ?? UNASSIGNED}
          onValueChange={(value) =>
            reassignTeacher.mutate({
              assignmentId: row.id,
              teacherId: value === UNASSIGNED ? null : value,
            })
          }
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Unassigned" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
            {teachers?.map((teacher) => (
              <SelectItem key={teacher.id} value={teacher.id}>
                {teacher.user.firstName} {teacher.user.lastName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
    {
      header: '',
      className: 'text-right',
      cell: (row) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (confirm(`Remove ${row.subject.name} from this class?`)) {
              removeAssignment.mutate(row.id);
            }
          }}
        >
          <Trash2 className="size-4 text-destructive" />
        </Button>
      ),
    },
  ];

  const assignedSubjectIds = new Set(assignments?.map((a) => a.subject.id));
  const availableModules = modules?.filter((moduleItem) => !assignedSubjectIds.has(moduleItem.id));

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/classes"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to classes
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {schoolClass ? `${schoolClass.name}${schoolClass.section ? ` - ${schoolClass.section}` : ''}` : '…'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {schoolClass ? `${schoolClass.level} · ${schoolClass.academicYear.name} · ${schoolClass._count.students} students` : ''}
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4" />
                Assign Module
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Assign Module to Class</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit((values) => assignModule.mutate(values))}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="subjectId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Module</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a module" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableModules?.map((moduleItem) => (
                              <SelectItem key={moduleItem.id} value={moduleItem.id}>
                                {moduleItem.code} — {moduleItem.name}
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
                    name="teacherId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teacher (optional)</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Unassigned" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {teachers?.map((teacher) => (
                              <SelectItem key={teacher.id} value={teacher.id}>
                                {teacher.user.firstName} {teacher.user.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit" disabled={assignModule.isPending}>
                      {assignModule.isPending ? 'Assigning…' : 'Assign'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Assigned Modules</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={assignments ?? []}
            isLoading={isLoading}
            getRowKey={(row) => row.id}
            emptyMessage="No modules assigned to this class yet."
          />
        </CardContent>
      </Card>
    </div>
  );
}
