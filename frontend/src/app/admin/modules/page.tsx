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
  sector: string | null;
  moduleType: 'SPECIFIC' | 'GENERAL' | 'COMPLEMENTARY' | null;
  competences: string[];
  isCore: boolean;
  department: Department | null;
  classes: Array<{ class: { id: string; name: string; level: string; academicYear: { name: string } } }>;
  _count: { classes: number };
}

interface SchoolClass {
  id: string;
  name: string;
  level: string;
  academicYear: { name: string };
  department: Department | null;
}

const moduleSchema = z.object({
  code: z.string().min(1, 'Required'),
  name: z.string().min(1, 'Required'),
  departmentId: z.string().min(1, 'Select a trade'),
  level: z.string().min(1, 'Select a level'),
  classId: z.string().min(1, 'Select a registered class'),
  sector: z.string().min(1, 'Required'),
  credits: z.string().regex(/^\d+$/, 'Enter a whole number').refine((value) => Number(value) > 0, 'Must be greater than zero'),
  learningHours: z.string().regex(/^\d+$/, 'Enter a whole number').refine((value) => Number(value) > 0, 'Must be greater than zero'),
  competences: z.string().min(1, 'Enter at least one competence'),
  moduleType: z.enum(['SPECIFIC', 'GENERAL', 'COMPLEMENTARY']),
});

const moduleTypeLabels = {
  SPECIFIC: 'Specific Module',
  GENERAL: 'General Module',
  COMPLEMENTARY: 'Complementary Module',
} as const;

type ModuleFormValues = z.infer<typeof moduleSchema>;

export default function AdminModulesPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['modules'],
    queryFn: async () => (await api.get<CourseModule[]>('/modules')).data,
  });

  const { data: classes } = useQuery({
    queryKey: ['classes-options'],
    queryFn: async () => (await api.get<SchoolClass[]>('/classes')).data,
  });

  const form = useForm<ModuleFormValues>({
    resolver: zodResolver(moduleSchema),
    defaultValues: {
      code: '',
      name: '',
      departmentId: '',
      level: '',
      classId: '',
      sector: '',
      credits: '',
      learningHours: '',
      competences: '',
      moduleType: 'SPECIFIC',
    },
  });

  const selectedDepartmentId = form.watch('departmentId');
  const selectedLevel = form.watch('level');
  const availableTrades = Array.from(
    new Map(
      (classes ?? [])
        .filter((schoolClass) => schoolClass.department)
        .map((schoolClass) => [schoolClass.department!.id, schoolClass.department!]),
    ).values(),
  );
  const availableLevels = Array.from(
    new Set(
      (classes ?? [])
        .filter((schoolClass) => schoolClass.department?.id === selectedDepartmentId)
        .map((schoolClass) => schoolClass.level),
    ),
  ).sort();
  const availableClasses = (classes ?? []).filter(
    (schoolClass) =>
      schoolClass.department?.id === selectedDepartmentId && schoolClass.level === selectedLevel,
  );

  const createModule = useMutation({
    mutationFn: async (values: ModuleFormValues) =>
      api.post('/modules', {
        code: values.code,
        name: values.name,
        classId: values.classId,
        sector: values.sector,
        credits: Number(values.credits),
        learningHours: Number(values.learningHours),
        competences: values.competences.split('\n').map((line) => line.trim()).filter(Boolean),
        moduleType: values.moduleType,
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
    { header: 'Trade', cell: (row) => row.department?.name ?? '—' },
    {
      header: 'Class',
      cell: (row) => (row.classes ?? []).map((item) => item.class.name).join(', ') || 'Not assigned',
    },
    { header: 'Sector', cell: (row) => row.sector ?? '—' },
    { header: 'Credits', cell: (row) => row.credits ?? '—' },
    { header: 'Learning Hours', cell: (row) => row.learningHours ?? '—' },
    {
      header: 'Type',
      cell: (row) => <Badge variant="secondary">{row.moduleType ? moduleTypeLabels[row.moduleType] : 'Not specified'}</Badge>,
    },
    { header: 'Classes', cell: (row) => row._count?.classes ?? row.classes?.length ?? 0 },
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Modules</h2>
          <p className="text-sm text-muted-foreground">Create modules and assign them directly to registered classes</p>
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
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Module</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((values) => createModule.mutate(values))}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Module code</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. CSACD302" {...field} />
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
                          <Input placeholder="e.g. Computer System Deployment" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="departmentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Trade</FormLabel>
                        <Select value={field.value} onValueChange={(value) => {
                          field.onChange(value);
                          form.setValue('level', '');
                          form.setValue('classId', '');
                        }}>
                          <FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Select trade" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {availableTrades.map((trade) => <SelectItem key={trade.id} value={trade.id}>{trade.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
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
                        <Select value={field.value} disabled={!selectedDepartmentId} onValueChange={(value) => {
                          field.onChange(value);
                          form.setValue('classId', '');
                        }}>
                          <FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Select level" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {availableLevels.map((level) => <SelectItem key={level} value={level}>{level}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="classId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assign to class</FormLabel>
                        <Select value={field.value} disabled={!selectedLevel} onValueChange={field.onChange}>
                          <FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Select class" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {availableClasses.map((schoolClass) => (
                              <SelectItem key={schoolClass.id} value={schoolClass.id}>
                                {schoolClass.name} ({schoolClass.academicYear.name})
                              </SelectItem>
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
                    name="sector"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sector</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. ICT and Multimedia" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="moduleType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Module type</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            {Object.entries(moduleTypeLabels).map(([value, label]) => (
                              <SelectItem key={value} value={value}>{label}</SelectItem>
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
                    name="credits"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Credits</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} placeholder="e.g. 5" {...field} />
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
                          <Input type="number" min={1} placeholder="e.g. 50" {...field} />
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
                          placeholder={'Deploy Computer System'}
                          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
                        />
                      </FormControl>
                      <FormMessage />
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
