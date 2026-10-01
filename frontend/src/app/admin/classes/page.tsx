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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { api } from '@/lib/api';

interface AcademicYear {
  id: string;
  name: string;
  isCurrent: boolean;
}

interface Department {
  id: string;
  name: string;
  code: string;
}

interface SchoolClass {
  id: string;
  name: string;
  level: string;
  section: string | null;
  academicYear: { id: string; name: string };
  department: Department | null;
  _count: { students: number };
}

const classSchema = z.object({
  departmentId: z.string().min(1, 'Select a trade'),
  className: z.string().min(1, 'Select a class'),
  academicYearId: z.string().min(1, 'Required'),
});

const classNamesByDepartmentCode: Record<string, string[]> = {
  CSA: ['L3 CSA', 'L4 CSA', 'L5 CSA'],
  SOD: ['L3 SWD', 'L4 SWD', 'L5 SWD'],
  NIT: ['L3 NIT', 'L4 NIT', 'L5 NIT'],
  ELT: ['L3 ELT', 'L4 ELT', 'L5 ELT'],
  ETT: ['L3 ETE', 'L4 ETE', 'L5 ETE'],
  BCN: ['L3 BDC', 'L4 BDC', 'L5 BDC'],
  ACC: ['S4 ACC', 'S5 ACC', 'S6 ACC'],
};

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

  const { data: departments } = useQuery({
    queryKey: ['departments-options'],
    queryFn: async () => (await api.get<Department[]>('/departments')).data,
  });

  const form = useForm<ClassFormValues>({
    resolver: zodResolver(classSchema),
    defaultValues: { departmentId: '', className: '', academicYearId: '' },
  });

  const selectedDepartment = departments?.find(
    (department) => department.id === form.watch('departmentId'),
  );
  const classChoices = selectedDepartment
    ? classNamesByDepartmentCode[selectedDepartment.code] ?? []
    : [];

  const createClass = useMutation({
    mutationFn: async (values: ClassFormValues) =>
      api.post('/classes', {
        name: values.className,
        level: values.className.split(' ')[0],
        departmentId: values.departmentId,
        academicYearId: values.academicYearId,
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
    { header: 'Trade', cell: (row) => row.department?.name ?? 'Not assigned' },
    { header: 'Class level', cell: (row) => row.level },
    { header: 'Academic Year', cell: (row) => row.academicYear.name },
    { header: 'Capacity', cell: (row) => row._count.students },
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Classes</h2>
          <p className="text-sm text-muted-foreground">Manage trade classes and assigned students</p>
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
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="departmentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Trade / programme</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                            form.setValue('className', '', { shouldValidate: true });
                          }}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select trade" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {departments?.filter((department) => classNamesByDepartmentCode[department.code]).map((department) => (
                              <SelectItem key={department.id} value={department.id}>
                                {department.name}
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
                    name="className"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{selectedDepartment?.code === 'ACC' ? 'Senior class' : 'Level and class'}</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={!selectedDepartment}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder={selectedDepartment ? 'Select class' : 'Select trade first'} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {classChoices.map((className) => (
                              <SelectItem key={className} value={className}>{className}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                                {year.name}{year.isCurrent ? ' (current)' : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
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
