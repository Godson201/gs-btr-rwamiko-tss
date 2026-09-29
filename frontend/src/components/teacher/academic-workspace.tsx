'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, CalendarCheck, CheckCircle2, ClipboardCheck, FileQuestion, Filter, GraduationCap, Library, Plus, Search, ShieldCheck, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';

type Mode = 'classes' | 'modules' | 'attendance' | 'assessments' | 'marks' | 'questions' | 'resources' | 'conduct';
interface Allocation { id: string; class: { id: string; name: string; level: string; section: string | null }; subject: { id: string; code: string; name: string; credits: number | null; learningHours?: number | null } }
interface Student { id: string; admissionNo: string; user: { firstName: string; lastName: string }; class?: { name: string } }
interface RecordItem { id: string; title: string; type: string; allocation: string; date: string; status: string }

const config = {
  classes: { title: 'Classes & Trades', subtitle: 'Your teaching groups across technical and general education programmes', action: 'Class overview', icon: Users },
  modules: { title: 'Teaching Modules', subtitle: 'Plan delivery, monitor learning hours and track module progress', action: 'Plan module', icon: BookOpen },
  attendance: { title: 'Class Attendance', subtitle: 'Record accurate daily attendance and follow up learner participation', action: 'Take attendance', icon: CalendarCheck },
  assessments: { title: 'Assessments & Exams', subtitle: 'Manage quizzes, assignments, continuous assessment and examinations', action: 'Create assessment', icon: ClipboardCheck },
  marks: { title: 'Marks Management', subtitle: 'Capture, validate and analyse assessment and term marks', action: 'Enter marks', icon: GraduationCap },
  questions: { title: 'Question Bank', subtitle: 'Build moderated questions reusable across quizzes and examinations', action: 'Add question', icon: FileQuestion },
  resources: { title: 'Notes & Manuals', subtitle: 'Organise module notes, workshop manuals and learner resources', action: 'Upload resource', icon: Library },
  conduct: { title: 'Learner Conduct', subtitle: 'Recognise good conduct and document interventions fairly', action: 'Add conduct record', icon: ShieldCheck },
} as const;

const recordTypes: Record<Mode, string[]> = {
  classes: ['Class plan', 'Learner list'], modules: ['Scheme of work', 'Lesson plan'], attendance: ['Daily attendance'],
  assessments: ['Quiz', 'Assignment', 'CAT', 'Mid-term exam', 'End-term exam'], marks: ['Quiz marks', 'Assignment marks', 'Examination marks', 'Term marks'],
  questions: ['Multiple choice', 'Short answer', 'Practical task', 'Essay'], resources: ['Learner notes', 'Teacher guide', 'Workshop manual', 'Reference material'],
  conduct: ['Good conduct', 'Leadership', 'Improvement note', 'Discipline intervention'],
};

export function AcademicWorkspace({ mode }: { mode: Mode }) {
  const meta = config[mode]; const Icon = meta.icon;
  const [query, setQuery] = useState(''); const [showForm, setShowForm] = useState(false); const [records, setRecords] = useState<RecordItem[]>([]);
  const [selectedAllocation, setSelectedAllocation] = useState(''); const [title, setTitle] = useState(''); const [type, setType] = useState(recordTypes[mode][0]);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const { data: allocations = [], isLoading } = useQuery({ queryKey: ['teacher-assignments'], queryFn: async () => (await api.get<Allocation[]>('/teachers/me/assignments')).data });
  const active = allocations.find((item) => item.id === selectedAllocation) ?? allocations[0];
  const { data: studentPage } = useQuery({ queryKey: ['teacher-class-students', active?.class.id], enabled: mode === 'attendance' && Boolean(active), queryFn: async () => (await api.get<{ data: Student[] }>('/students', { params: { classId: active!.class.id, pageSize: 100 } })).data });
  const filtered = useMemo(() => allocations.filter((item) => `${item.class.name} ${item.subject.name} ${item.subject.code}`.toLowerCase().includes(query.toLowerCase())), [allocations, query]);

  function saveRecord() {
    if (!active || !title.trim()) { toast.error('Choose a class/module and enter a title.'); return; }
    setRecords((current) => [{ id: crypto.randomUUID(), title: title.trim(), type, allocation: `${active.class.name} • ${active.subject.code}`, date: new Date().toLocaleDateString(), status: 'Draft' }, ...current]);
    setTitle(''); setShowForm(false); toast.success(`${type} saved as a draft.`);
  }
  function saveAttendance() {
    const students = studentPage?.data ?? [];
    if (!students.length) { toast.error('No learners are enrolled in this class.'); return; }
    if (students.some((student) => !attendance[student.id])) { toast.error('Mark every learner before saving.'); return; }
    toast.success(`Attendance completed for ${students.length} learners.`);
  }

  return <div className="space-y-6">
    <section className="flex flex-col justify-between gap-5 rounded-3xl bg-gradient-to-r from-slate-950 to-blue-900 p-6 text-white md:flex-row md:items-center"><div className="flex gap-4"><div className="h-fit rounded-2xl bg-cyan-400/15 p-3 text-cyan-300"><Icon className="size-7" /></div><div><h2 className="text-2xl font-bold">{meta.title}</h2><p className="mt-1 max-w-2xl text-sm text-slate-300">{meta.subtitle}</p></div></div>{mode !== 'attendance' && <Button onClick={() => setShowForm(true)} className="bg-cyan-400 text-slate-950 hover:bg-cyan-300"><Plus /> {meta.action}</Button>}</section>

    <div className="grid gap-4 sm:grid-cols-3"><Card><CardContent className="p-5"><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Assigned classes</p><p className="mt-2 text-3xl font-bold">{new Set(allocations.map((x) => x.class.id)).size}</p></CardContent></Card><Card><CardContent className="p-5"><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Teaching modules</p><p className="mt-2 text-3xl font-bold">{allocations.length}</p></CardContent></Card><Card><CardContent className="p-5"><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Workspace records</p><p className="mt-2 text-3xl font-bold">{records.length}</p></CardContent></Card></div>

    {mode === 'attendance' ? <Card><CardContent className="p-6"><div className="mb-5 flex flex-wrap items-end gap-3"><label className="min-w-64 flex-1 text-sm font-medium">Class and module<select className="mt-2 h-10 w-full rounded-md border bg-white px-3" value={active?.id ?? ''} onChange={(e) => { setSelectedAllocation(e.target.value); setAttendance({}); }}>{allocations.map((item) => <option key={item.id} value={item.id}>{item.class.name} — {item.subject.name}</option>)}</select></label><label className="text-sm font-medium">Date<Input className="mt-2" type="date" defaultValue={new Date().toISOString().slice(0, 10)} /></label><Button onClick={() => { const students = studentPage?.data ?? []; setAttendance(Object.fromEntries(students.map((s) => [s.id, 'PRESENT']))); }} variant="outline"><CheckCircle2 /> Mark all present</Button></div><div className="overflow-x-auto rounded-xl border"><table className="w-full text-sm"><thead className="bg-slate-100 text-left"><tr><th className="p-3">Learner</th><th className="p-3">Admission number</th><th className="p-3">Attendance status</th></tr></thead><tbody>{(studentPage?.data ?? []).map((student) => <tr key={student.id} className="border-t"><td className="p-3 font-medium" data-no-translate>{student.user.firstName} {student.user.lastName}</td><td className="p-3 text-muted-foreground" data-no-translate>{student.admissionNo}</td><td className="p-3"><select className="h-9 rounded-md border bg-white px-3" value={attendance[student.id] ?? ''} onChange={(e) => setAttendance((current) => ({ ...current, [student.id]: e.target.value }))}><option value="">Select status</option><option value="PRESENT">Present</option><option value="ABSENT">Absent</option><option value="LATE">Late</option><option value="EXCUSED">Excused</option></select></td></tr>)}</tbody></table>{!studentPage?.data?.length && <div className="p-10 text-center text-sm text-muted-foreground">Select an assigned class with enrolled learners to begin.</div>}</div><div className="mt-5 flex justify-end"><Button onClick={saveAttendance}><CalendarCheck /> Save attendance register</Button></div></CardContent></Card> : <>
      {showForm && <Card className="border-cyan-300 bg-cyan-50/60"><CardContent className="p-6"><div className="mb-4"><h3 className="font-bold">{meta.action}</h3><p className="text-sm text-muted-foreground">Complete the essential details. You can continue editing after saving.</p></div><div className="grid gap-4 md:grid-cols-3"><label className="text-sm font-medium">Title<Input className="mt-2 bg-white" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={`Enter ${recordTypes[mode][0].toLowerCase()} title`} /></label><label className="text-sm font-medium">Type<select className="mt-2 h-10 w-full rounded-md border bg-white px-3" value={type} onChange={(e) => setType(e.target.value)}>{recordTypes[mode].map((value) => <option key={value}>{value}</option>)}</select></label><label className="text-sm font-medium">Class and module<select className="mt-2 h-10 w-full rounded-md border bg-white px-3" value={selectedAllocation} onChange={(e) => setSelectedAllocation(e.target.value)}><option value="">Select allocation</option>{allocations.map((item) => <option key={item.id} value={item.id}>{item.class.name} — {item.subject.code}</option>)}</select></label></div><div className="mt-5 flex justify-end gap-2"><Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button><Button onClick={saveRecord}>Save draft</Button></div></CardContent></Card>}
      <Card><CardContent className="p-6"><div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row"><div className="relative max-w-md flex-1"><Search className="absolute left-3 top-3 size-4 text-muted-foreground" /><Input value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" placeholder="Search classes, trades or modules" /></div><Button variant="outline"><Filter /> Filter</Button></div>
        {records.length > 0 && <div className="mb-6 space-y-2">{records.map((record) => <div key={record.id} className="flex items-center gap-4 rounded-xl border p-4"><div className="rounded-lg bg-cyan-50 p-2 text-cyan-700"><Icon className="size-5" /></div><div className="flex-1"><p className="font-semibold">{record.title}</p><p className="text-xs text-muted-foreground">{record.type} • {record.allocation} • {record.date}</p></div><Badge variant="secondary">{record.status}</Badge></div>)}</div>}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{isLoading ? <p className="text-sm text-muted-foreground">Loading your teaching allocation…</p> : filtered.map((item) => <div key={item.id} className="rounded-2xl border bg-slate-50 p-5"><div className="flex items-start justify-between gap-3"><div className="rounded-xl bg-blue-100 p-2.5 text-blue-700"><Icon className="size-5" /></div><Badge variant="outline">{item.subject.code}</Badge></div><h3 className="mt-4 font-bold">{item.subject.name}</h3><p className="mt-1 text-sm text-muted-foreground">{item.class.name}{item.class.section ? ` • ${item.class.section}` : ''} · {item.class.level}</p><div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-xs text-muted-foreground"><span>{item.subject.learningHours ?? 0} learning hours</span><button className="font-semibold text-blue-700" onClick={() => { setSelectedAllocation(item.id); setShowForm(true); }}>Manage</button></div></div>)}</div>{!isLoading && filtered.length === 0 && <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">No assigned classes or modules match this view.</div>}
      </CardContent></Card></>}
  </div>;
}
