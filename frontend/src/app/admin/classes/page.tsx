'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { api } from '@/lib/api';

interface AcademicYear {
  id: string;
  name: string;
  isCurrent: boolean;
}

interface SchoolClass {
  id: string;
  name: string;
  level: string;
  section: string | null;
  capacity: number | null;
  academicYear: { id: string; name: string };
  _count: { students: number };
}

const classSchema = z.object({
  name: z.string().min(1, 'Required'),
  level: z.string().min(1, 'Required'),
  section: z.string().optional(),
  academicYearId: z.string().min(1, 'Required'),
  capacity: z.string().optional(),
});

type ClassFormValues = z.infer<typeof classSchema>;

export default function AdminClassesPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => (await api.get<SchoolClass[]>('/classes')).data,
  });

  const { data: academicYears } = useQuery({
    queryKey: ['academic-years-options'],
    queryFn: async () => (await api.get<AcademicYear[]>('/academic-years')).data,
  });

  const form = useForm<ClassFormValues>({
    resolver: zodResolver(classSchema),
    defaultValues: { name: '', level: '', section: '', academicYearId: '', capacity: undefined },
  });

  const createClass = useMutation({
    mutationFn: async (values: ClassFormValues) =>
      api.post('/classes', {
        ...values,
        capacity: values.capacity ? Number(values.capacity) : undefined,
      }),
    onSuccess: () => {
      toast.success('Class created');
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['classes-options'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteClass = useMutation({
    mutationFn: async (id: string) => api.delete(`/classes/${id}`),
    onSuccess: () => {
      toast.success('Class removed');
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const columns: DataTableColumn<SchoolClass>[] = [
    {
      header: 'Class',
      cell: (row) => (
        <Link href={`/admin/classes/${row.id}`} className="font-medium hover:underline">
          {row.name}
          {row.section ? ` - ${row.section}` : ''}
        </Link>
      ),
    },
    { header: 'Level', cell: (row) => row.level },
    { header: 'Academic Year', cell: (row) => row.academicYear.name },
    { header: 'Students', cell: (row) => row._count.students },
    { header: 'Capacity', cell: (row) => row.capacity ?? '—' },
    {
      header: '',
      className: 'text-right',
      cell: (row) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (confirm(`Delete class ${row.name}? This cannot be undone.`)) {
              deleteClass.mutate(row.id);
            }
          }}
        >
          <Trash2 className="size-4 text-destructive" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Classes</h2>
          <p className="text-sm text-muted-foreground">Manage class groups and capacity</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4" />
              Add Class
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Class</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((values) => createClass.mutate(values))}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Class name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Senior 4 Software Dev" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Level</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. S4" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="section"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Section (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. A" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="capacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Capacity (optional)</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="academicYearId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Academic year</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select academic year" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {academicYears?.map((year) => (
                            <SelectItem key={year.id} value={year.id}>
                              {year.name}
                              {year.isCurrent ? ' (current)' : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={createClass.isPending}>
                    {createClass.isPending ? 'Saving…' : 'Save class'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable columns={columns} data={data ?? []} isLoading={isLoading} getRowKey={(row) => row.id} />
    </div>
  );
}
