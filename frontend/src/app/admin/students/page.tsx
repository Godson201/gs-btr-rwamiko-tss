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
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { api } from '@/lib/api';

interface Department { id: string; name: string; code: string }
interface ClassOption { id: string; name: string; level: string; section?: string | null; department: Department | null; academicYear: { id: string; name: string } }
interface ParentOption { id: string; user: { firstName: string; lastName: string } }
interface Student {
  id: string; admissionNo: string; nationalId: string | null; previousMarks: number | null;
  academicYear: string; isGraduated: boolean; class: ClassOption | null; parent: ParentOption | null;
  guardianPhone: string | null;
  user: { id: string; firstName: string; middleName: string | null; lastName: string };
}

const studentSchema = z.object({
  firstName: z.string().min(1, 'Required'), middleName: z.string().optional(), lastName: z.string().min(1, 'Required'),
  dateOfBirth: z.string().min(1, 'Required'), gender: z.enum(['MALE', 'FEMALE', 'OTHER']), nationalId: z.string().optional(),
  departmentId: z.string().min(1, 'Select a trade'), level: z.string().min(1, 'Select a level'), classId: z.string().min(1, 'Select a class'),
  previousMarks: z.string().min(1, 'Required').refine((value) => Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 100, 'Marks must be between 0 and 100'),
  address: z.string().min(1, 'Required'), motherName: z.string().min(1, 'Required'), fatherName: z.string().min(1, 'Required'),
  guardianPhone: z.string().optional(), linkExistingParent: z.boolean(), parentId: z.string().optional(),
}).superRefine((values, context) => {
  if (values.linkExistingParent && !values.parentId) context.addIssue({ code: 'custom', path: ['parentId'], message: 'Select a parent or guardian' });
});
type StudentFormValues = z.infer<typeof studentSchema>;
const defaults: StudentFormValues = {
  firstName: '', middleName: '', lastName: '', dateOfBirth: '', gender: 'MALE', nationalId: '', departmentId: '',
  level: '', classId: '', previousMarks: '', address: '', motherName: '', fatherName: '', guardianPhone: '',
  linkExistingParent: false, parentId: '',
};

export default function AdminStudentsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data, isLoading } = useQuery({ queryKey: ['students', search], queryFn: async () => (await api.get<{ data: Student[] }>('/students', { params: { search } })).data.data });
  const { data: classes } = useQuery({ queryKey: ['classes-options'], queryFn: async () => (await api.get<ClassOption[]>('/classes')).data });
  const { data: parents } = useQuery({ queryKey: ['parents-options'], queryFn: async () => (await api.get<ParentOption[]>('/parents')).data });
  const form = useForm<StudentFormValues>({ resolver: zodResolver(studentSchema), defaultValues: defaults });
  const departmentId = form.watch('departmentId');
  const level = form.watch('level');
  const classId = form.watch('classId');
  const linkExistingParent = form.watch('linkExistingParent');
  const trades = Array.from(new Map((classes ?? []).filter((item) => item.department).map((item) => [item.department!.id, item.department!])).values());
  const levels = Array.from(new Set((classes ?? []).filter((item) => item.department?.id === departmentId).map((item) => item.level))).sort();
  const classOptions = (classes ?? []).filter((item) => item.department?.id === departmentId && item.level === level);
  const selectedClass = classes?.find((item) => item.id === classId);

  const createStudent = useMutation({
    mutationFn: async (values: StudentFormValues) => api.post('/students', {
      firstName: values.firstName, middleName: values.middleName || undefined, lastName: values.lastName,
      dateOfBirth: values.dateOfBirth, gender: values.gender, nationalId: values.nationalId || undefined,
      classId: values.classId, previousMarks: Number(values.previousMarks), address: values.address,
      motherName: values.motherName, fatherName: values.fatherName, guardianPhone: values.guardianPhone || undefined,
      parentId: values.linkExistingParent ? values.parentId : undefined,
    }),
    onSuccess: () => { toast.success('Student academic record created'); queryClient.invalidateQueries({ queryKey: ['students'] }); queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] }); setIsDialogOpen(false); form.reset(defaults); },
    onError: (error: Error) => toast.error(error.message),
  });
  const deleteStudent = useMutation({
    mutationFn: async (id: string) => api.delete(`/students/${id}`),
    onSuccess: () => { toast.success('Student removed'); queryClient.invalidateQueries({ queryKey: ['students'] }); queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] }); },
    onError: (error: Error) => toast.error(error.message),
  });

  const columns: DataTableColumn<Student>[] = [
    { header: 'Student', cell: (row) => <div><div className="font-medium">{[row.user.firstName, row.user.middleName, row.user.lastName].filter(Boolean).join(' ')}</div><div className="text-xs text-muted-foreground">{row.admissionNo}</div></div> },
    { header: 'Trade', cell: (row) => row.class?.department?.name ?? 'Not assigned' },
    { header: 'Class', cell: (row) => row.class?.name ?? 'Not assigned' },
    { header: 'Previous marks', cell: (row) => row.previousMarks == null ? '—' : `${row.previousMarks}%` },
    { header: 'Academic year', cell: (row) => row.academicYear },
    { header: 'Parent link', cell: (row) => <Badge variant={row.parent ? 'default' : 'secondary'}>{row.parent ? `${row.parent.user.firstName} ${row.parent.user.lastName}` : 'Not linked'}</Badge> },
    { header: '', className: 'text-right', cell: (row) => <Button variant="ghost" size="icon" onClick={() => { if (confirm(`Remove ${row.user.firstName} ${row.user.lastName}? This cannot be undone.`)) deleteStudent.mutate(row.id); }}><Trash2 className="size-4 text-destructive" /></Button> },
  ];

  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-2xl font-bold tracking-tight">Students</h2><p className="text-sm text-muted-foreground">Manage learner identity, family details, and academic placement</p></div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild><Button><Plus className="size-4" />Add Student</Button></DialogTrigger>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader><DialogTitle>Add Student Academic Record</DialogTitle></DialogHeader>
          <Form {...form}><form onSubmit={form.handleSubmit((values) => createStudent.mutate(values))} className="space-y-6">
            <FormSection title="1. Student identity" description="Enter names exactly as shown on the learner's official documents.">
              <div className="grid gap-4 sm:grid-cols-3"><TextField form={form} name="firstName" label="First name" /><TextField form={form} name="middleName" label="Middle name (optional)" /><TextField form={form} name="lastName" label="Last name" /></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField control={form.control} name="dateOfBirth" render={({ field }) => <FormItem><FormLabel>Birth date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>} />
                <FormField control={form.control} name="nationalId" render={({ field }) => <FormItem><FormLabel>National ID (if available)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
              </div>
              <FormField control={form.control} name="gender" render={({ field }) => <FormItem><FormLabel>Gender</FormLabel><FormControl><div className="flex flex-wrap gap-5 rounded-lg border p-3">{[['MALE','Male'],['FEMALE','Female'],['OTHER','Other']].map(([value,label]) => <label key={value} className="flex cursor-pointer items-center gap-2 text-sm"><input type="radio" name={field.name} value={value} checked={field.value === value} onChange={() => field.onChange(value)} />{label}</label>)}</div></FormControl><FormMessage /></FormItem>} />
            </FormSection>
            <FormSection title="2. Academic placement" description="Choose the trade and level first; only matching registered classes will appear.">
              <div className="grid gap-4 sm:grid-cols-3">
                <FormField control={form.control} name="departmentId" render={({ field }) => <FormItem><FormLabel>Trade</FormLabel><Select value={field.value} onValueChange={(value) => { field.onChange(value); form.setValue('level',''); form.setValue('classId',''); }}><FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Select trade" /></SelectTrigger></FormControl><SelectContent>{trades.map((trade) => <SelectItem key={trade.id} value={trade.id}>{trade.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} />
                <FormField control={form.control} name="level" render={({ field }) => <FormItem><FormLabel>Level</FormLabel><Select value={field.value} disabled={!departmentId} onValueChange={(value) => { field.onChange(value); form.setValue('classId',''); }}><FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Select level" /></SelectTrigger></FormControl><SelectContent>{levels.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} />
                <FormField control={form.control} name="classId" render={({ field }) => <FormItem><FormLabel>Class</FormLabel><FormControl><ControlledSelect options={classOptions.map((item) => ({ value: item.id, label: item.name }))} value={field.value} disabled={!level} placeholder="Select class" onChange={field.onChange} /></FormControl><FormMessage /></FormItem>} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormItem><FormLabel>Academic year</FormLabel><Input value={selectedClass?.academicYear.name ?? ''} placeholder="Selected automatically from class" readOnly className="bg-muted" /></FormItem>
                <FormField control={form.control} name="previousMarks" render={({ field }) => <FormItem><FormLabel>Marks obtained in previous level or term (%)</FormLabel><FormControl><Input type="number" min={0} max={100} step="0.01" placeholder="e.g. 72.5" {...field} /></FormControl><FormMessage /></FormItem>} />
              </div>
            </FormSection>
            <FormSection title="3. Home and family information" description="Provide the learner's home address and parent or guardian contacts.">
              <TextField form={form} name="address" label="Home address" />
              <div className="grid gap-4 sm:grid-cols-2"><TextField form={form} name="motherName" label="Mother's name" /><TextField form={form} name="fatherName" label="Father's name" /></div>
              <TextField form={form} name="guardianPhone" label="Parent or guardian telephone (optional)" type="tel" />
            </FormSection>
            <FormSection title="4. Parent account link" description="Optionally connect this learner to an existing verified parent account.">
              <FormField control={form.control} name="linkExistingParent" render={({ field }) => <FormItem><FormControl><label className="flex cursor-pointer items-center gap-3 rounded-lg border p-3"><input type="checkbox" checked={field.value} onChange={(event) => { field.onChange(event.target.checked); if (!event.target.checked) form.setValue('parentId',''); }} /><span><span className="block font-medium">Link student to an existing parent</span><span className="block text-xs text-muted-foreground">Leave unchecked if the parent has not created an account.</span></span></label></FormControl></FormItem>} />
              {linkExistingParent && <FormField control={form.control} name="parentId" render={({ field }) => <FormItem><FormLabel>Parent or guardian account</FormLabel><FormControl><ControlledSelect options={(parents ?? []).map((parent) => ({ value: parent.id, label: `${parent.user.firstName} ${parent.user.lastName}` }))} value={field.value ?? ''} placeholder="Select parent or guardian" onChange={field.onChange} /></FormControl><FormMessage /></FormItem>} />}
            </FormSection>
            <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900">Admission number and enrollment date are generated automatically. No student username or password is required.</div>
            <DialogFooter><Button type="submit" disabled={createStudent.isPending}>{createStudent.isPending ? 'Saving…' : 'Save student record'}</Button></DialogFooter>
          </form></Form>
        </DialogContent>
      </Dialog>
    </div>
    <Input placeholder="Search by name, admission number, or national ID…" value={search} onChange={(event) => setSearch(event.target.value)} className="max-w-md" />
    <DataTable columns={columns} data={data ?? []} isLoading={isLoading} getRowKey={(row) => row.id} />
  </div>;
}

function FormSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <section className="space-y-4 rounded-xl border p-4"><div><h3 className="font-semibold">{title}</h3><p className="text-xs text-muted-foreground">{description}</p></div>{children}</section>;
}
function TextField({ form, name, label, type = 'text' }: { form: ReturnType<typeof useForm<StudentFormValues>>; name: keyof StudentFormValues; label: string; type?: string }) {
  return <FormField control={form.control} name={name} render={({ field }) => <FormItem><FormLabel>{label}</FormLabel><FormControl><Input type={type} value={typeof field.value === 'string' ? field.value : ''} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} /></FormControl><FormMessage /></FormItem>} />;
}

function ControlledSelect({ options, value, onChange, placeholder, disabled = false }: {
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  return <select value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50">
    <option value="">{placeholder}</option>
    {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
  </select>;
}
