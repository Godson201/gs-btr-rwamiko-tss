'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, UserPlus } from 'lucide-react';
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
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { api } from '@/lib/api';
import { STAFF_TITLE_OPTIONS, type StaffTitle } from '@/lib/staff-title';

interface Department {
  id: string;
  name: string;
  code: string;
}

interface Teacher {
  id: string;
  employeeNo: string;
  qualification: string | null;
  specialization: string | null;
  staffTitle: StaffTitle | null;
  department: Department | null;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    isActive: boolean;
    portalAccess: ('STUDENT' | 'TEACHER' | 'PARENT' | 'ADMIN' | 'SUPER_ADMIN')[];
  };
}

const teacherSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  phone: z.string().optional(),
  dateOfBirth: z.string().min(1, 'Required'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  qualification: z.string().optional(),
  specialization: z.string().optional(),
  departmentId: z.string().optional(),
});

type TeacherFormValues = z.infer<typeof teacherSchema>;

export default function AdminTeachersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['teachers', search],
    queryFn: async () =>
      (await api.get<{ data: Teacher[] }>('/teachers', { params: { search } })).data.data,
  });

  const { data: departments } = useQuery({
    queryKey: ['departments-options'],
    queryFn: async () => (await api.get<Department[]>('/departments')).data,
  });

  const form = useForm<TeacherFormValues>({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      dateOfBirth: '',
      gender: 'OTHER',
      qualification: '',
      specialization: '',
      departmentId: undefined,
    },
  });

  const createTeacher = useMutation({
    mutationFn: async (values: TeacherFormValues) => api.post('/teachers', values),
    onSuccess: (_response, values) => {
      toast.success(`Teacher created — login details emailed to ${values.email}`);
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteTeacher = useMutation({
    mutationFn: async (id: string) => api.delete(`/teachers/${id}`),
    onSuccess: () => {
      toast.success('Teacher removed');
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const setStaffTitle = useMutation({
    mutationFn: async ({ id, staffTitle }: { id: string; staffTitle: StaffTitle | null }) =>
      api.patch(`/teachers/${id}`, { staffTitle }),
    onSuccess: () => {
      toast.success('Staff title updated');
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const grantParentAccess = useMutation({
    mutationFn: async (userId: string) => api.post(`/users/${userId}/grant-role`, { role: 'PARENT' }),
    onSuccess: () => {
      toast.success('Parent portal access granted');
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const columns: DataTableColumn<Teacher>[] = [
    {
      header: 'Name',
      cell: (row) => (
        <div>
          <div className="font-medium">
            {row.user.firstName} {row.user.lastName}
          </div>
          <div className="text-xs text-muted-foreground">{row.user.email}</div>
        </div>
      ),
    },
    { header: 'Employee No.', cell: (row) => row.employeeNo },
    { header: 'Department', cell: (row) => row.department?.name ?? '—' },
    { header: 'Specialization', cell: (row) => row.specialization ?? '—' },
    {
      header: 'Staff Title',
      cell: (row) => (
        <Select
          value={row.staffTitle ?? 'NONE'}
          onValueChange={(value) =>
            setStaffTitle.mutate({ id: row.id, staffTitle: value === 'NONE' ? null : (value as StaffTitle) })
          }
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="NONE">None</SelectItem>
            {STAFF_TITLE_OPTIONS.map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
    {
      header: 'Status',
      cell: (row) => (
        <Badge variant={row.user.isActive ? 'default' : 'secondary'}>
          {row.user.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      header: '',
      className: 'text-right',
      cell: (row) => (
        <div className="flex justify-end gap-1">
          {!row.user.portalAccess.includes('PARENT') && (
            <Button
              variant="ghost"
              size="icon"
              title="Also grant Parent portal access"
              onClick={() => grantParentAccess.mutate(row.user.id)}
              disabled={grantParentAccess.isPending}
            >
              <UserPlus className="size-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (confirm(`Remove ${row.user.firstName} ${row.user.lastName}? This cannot be undone.`)) {
                deleteTeacher.mutate(row.id);
              }
            }}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Teachers</h2>
          <p className="text-sm text-muted-foreground">Manage teaching staff records</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4" />
              Add Teacher
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Teacher</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((values) => createTeacher.mutate(values))}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of birth</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="MALE">Male</SelectItem>
                            <SelectItem value="FEMALE">Female</SelectItem>
                            <SelectItem value="OTHER">Other</SelectItem>
                          </SelectContent>
                        </Select>
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
                    name="qualification"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Qualification</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="specialization"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Specialization</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createTeacher.isPending}>
                    {createTeacher.isPending ? 'Saving…' : 'Save teacher'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Input
        placeholder="Search teachers by name or email…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="max-w-sm"
      />

      <DataTable columns={columns} data={data ?? []} isLoading={isLoading} getRowKey={(row) => row.id} />
    </div>
  );
}
