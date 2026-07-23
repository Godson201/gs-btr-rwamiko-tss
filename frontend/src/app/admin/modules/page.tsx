'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Badge } from '@/components/ui/badge';
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
import { BulkUploadDialog } from '@/components/shared/bulk-upload-dialog';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { api } from '@/lib/api';

interface Department {
  id: string;
  name: string;
  code: string;
}

interface CourseModule {
  id: string;
  code: string;
  name: string;
  credits: number | null;
  learningHours: number | null;
  competences: string[];
  isCore: boolean;
  department: Department | null;
  _count: { classes: number };
}

const moduleSchema = z.object({
  code: z.string().min(1, 'Required'),
  name: z.string().min(1, 'Required'),
  departmentId: z.string().optional(),
  credits: z.string().optional(),
  learningHours: z.string().optional(),
  competences: z.string().optional(),
  isCore: z.boolean(),
});

type ModuleFormValues = z.infer<typeof moduleSchema>;

export default function AdminModulesPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['modules'],
    queryFn: async () => (await api.get<CourseModule[]>('/modules')).data,
  });

  const { data: departments } = useQuery({
    queryKey: ['departments-options'],
    queryFn: async () => (await api.get<Department[]>('/departments')).data,
  });

  const form = useForm<ModuleFormValues>({
    resolver: zodResolver(moduleSchema),
    defaultValues: {
      code: '',
      name: '',
      departmentId: undefined,
      credits: '',
      learningHours: '',
      competences: '',
      isCore: false,
    },
  });

  const createModule = useMutation({
    mutationFn: async (values: ModuleFormValues) =>
      api.post('/modules', {
        code: values.code,
        name: values.name,
        departmentId: values.departmentId,
        credits: values.credits ? Number(values.credits) : undefined,
        learningHours: values.learningHours ? Number(values.learningHours) : undefined,
        competences: values.competences
          ? values.competences.split('\n').map((line) => line.trim()).filter(Boolean)
          : undefined,
        isCore: values.isCore,
      }),
    onSuccess: () => {
      toast.success('Module created');
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteModule = useMutation({
    mutationFn: async (id: string) => api.delete(`/modules/${id}`),
    onSuccess: () => {
      toast.success('Module removed');
      queryClient.invalidateQueries({ queryKey: ['modules'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const columns: DataTableColumn<CourseModule>[] = [
    {
      header: 'Module',
      cell: (row) => (
        <div>
          <div className="font-medium">{row.name}</div>
          <div className="text-xs text-muted-foreground">{row.code}</div>
        </div>
      ),
    },
    { header: 'Department', cell: (row) => row.department?.name ?? '—' },
    { header: 'Credits', cell: (row) => row.credits ?? '—' },
    { header: 'Learning Hours', cell: (row) => row.learningHours ?? '—' },
    {
      header: 'Type',
      cell: (row) => <Badge variant={row.isCore ? 'default' : 'secondary'}>{row.isCore ? 'Core' : 'Elective'}</Badge>,
    },
    { header: 'Classes', cell: (row) => row._count.classes },
    {
      header: '',
      className: 'text-right',
      cell: (row) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (confirm(`Delete module ${row.name}? This cannot be undone.`)) {
              deleteModule.mutate(row.id);
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
          <h2 className="text-2xl font-bold tracking-tight">Modules</h2>
          <p className="text-sm text-muted-foreground">Manage course modules (code, credits, competences)</p>
        </div>
        <div className="flex gap-2">
          <BulkUploadDialog
            title="Bulk Upload Modules"
            description="Upload a .csv or .xlsx file with columns: code, name, departmentCode (optional), credits (optional), learningHours (optional), competences (optional, semicolon-separated), isCore (true/false, optional)."
            endpoint="/modules/bulk-import"
            invalidateKeys={['modules']}
            createdLabel={(row) => String(row.code)}
          />
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4" />
                Add Module
              </Button>
            </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Module</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((values) => createModule.mutate(values))}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Module code</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. SOD301" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Module name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Software Requirements Analysis" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="departmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Unassigned" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departments?.map((department) => (
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
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="credits"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Credits</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="learningHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Learning hours</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="competences"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Competences (one per line)</FormLabel>
                      <FormControl>
                        <textarea
                          {...field}
                          rows={4}
                          placeholder={'Install operating systems\nConfigure network devices'}
                          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isCore"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-2 space-y-0">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={(event) => field.onChange(event.target.checked)}
                          className="size-4 rounded border-input"
                        />
                      </FormControl>
                      <FormLabel className="font-normal">Core module</FormLabel>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={createModule.isPending}>
                    {createModule.isPending ? 'Saving…' : 'Save module'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      <DataTable columns={columns} data={data ?? []} isLoading={isLoading} getRowKey={(row) => row.id} />
    </div>
  );
}
