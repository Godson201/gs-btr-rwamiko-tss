'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { ArrowLeft, CheckCircle2, FileText, GraduationCap, Upload } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LocationPicker, type LocationPickerValue } from '@/components/shared/location-picker';

const programmes = ['Computer Systems & Architecture (CSA)', 'Software Development (SWD)', 'Network & Internet Technology (NIT)', 'Electrical Technology (ELT)', 'Electronics & Telecommunication (ETE)', 'Building Construction (BDC)', 'Professional Accounting (ACC)', 'General Education'];

const initialForm = { applicantType: 'PARENT', studentFirstName: '', studentLastName: '', studentDateOfBirth: '', studentGender: 'MALE', previousSchool: '', previousSchoolLocation: '', transferReason: '', averageMarks: '', applyingLevel: '', preferredProgramme: '', guardianFirstName: '', guardianLastName: '', guardianRelationship: '', guardianEmail: '', guardianPhone: '', residence: '', notes: '' };

export default function AdmissionsPage() {
  const [form, setForm] = useState(initialForm);
  const [file, setFile] = useState<File | null>(null);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [currentResidence, setCurrentResidence] = useState<LocationPickerValue | null>(null);
  const [previousSchoolLocation, setPreviousSchoolLocation] = useState<LocationPickerValue | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [applicationNo, setApplicationNo] = useState('');

  const update = (name: string, value: string) => setForm(current => ({ ...current, [name]: value }));

  async function submit(event: FormEvent) {
    event.preventDefault(); setError('');
    if (!currentResidence?.villageId) { setError('Please select the complete current residence through village.'); return; }
    if (!previousSchoolLocation?.villageId) { setError('Please select the complete previous school location through village.'); return; }
    if (!file) { setError('Please attach the student’s PDF report card or result slip.'); return; }
    if (!profilePicture) { setError('Please attach a JPG profile picture of the student.'); return; }
    if (file.type !== 'application/pdf') { setError('The report card or result slip must be a PDF file.'); return; }
    if (!['image/jpeg', 'image/jpg'].includes(profilePicture.type)) { setError('The student profile picture must be a JPG image.'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('The PDF must be 10 MB or smaller.'); return; }
    if (profilePicture.size > 10 * 1024 * 1024) { setError('The profile picture must be 10 MB or smaller.'); return; }
    const payload = new FormData(); Object.entries({ ...form, residence: formatLocation(currentResidence), previousSchoolLocation: formatLocation(previousSchoolLocation) }).forEach(([key, value]) => payload.append(key, value)); payload.append('resultDocument', file); payload.append('profilePicture', profilePicture);
    setSubmitting(true);
    try { const { data } = await api.post('/admissions', payload); setApplicationNo(data.applicationNo); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Application could not be submitted.'); }
    finally { setSubmitting(false); }
  }

  if (applicationNo) return <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12"><Image src="/students-campus.png" alt="" fill className="-z-20 object-cover" /><div className="absolute inset-0 -z-10 bg-slate-950/65" /><Card className="w-full max-w-lg border-0 text-center shadow-2xl"><CardContent className="p-10"><CheckCircle2 className="mx-auto size-16 text-emerald-500" /><h1 className="mt-5 text-3xl font-black">Application received</h1><p className="mt-3 text-muted-foreground">Keep this application number safe. The school will contact your guardian after review.</p><div className="mt-6 rounded-2xl bg-cyan-50 p-5"><p className="text-xs font-bold uppercase tracking-widest text-cyan-700">Application number</p><p className="mt-2 text-2xl font-black tracking-wide">{applicationNo}</p></div><Button asChild className="mt-7 rounded-full"><Link href="/">Return to homepage</Link></Button></CardContent></Card></main>;

  return (
    <main className="relative min-h-screen bg-slate-100 py-10 sm:py-16">
      <Image src="/students-classroom.png" alt="" fill className="fixed object-cover opacity-25" sizes="100vw" /><div className="fixed inset-0 bg-linear-to-b from-slate-950/45 via-white/75 to-white" />
      <div className="relative mx-auto max-w-5xl px-4">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-white"><ArrowLeft className="size-4" /> Back to school website</Link>
        <Card className="overflow-hidden border-0 shadow-2xl">
          <CardHeader className="bg-slate-950 px-6 py-8 text-white sm:px-10"><div className="flex items-center gap-4"><span className="rounded-2xl bg-cyan-400 p-3 text-slate-950"><GraduationCap className="size-7" /></span><div><CardTitle className="text-3xl font-black">Apply for admission</CardTitle><CardDescription className="mt-1 text-slate-300">Student and parent applications for G.S BTR Rwamiko TSS</CardDescription></div></div></CardHeader>
          <CardContent className="p-6 sm:p-10"><form onSubmit={submit} className="space-y-10">
            <FormSection title="Who is completing this form?" description="A student may apply directly, or a parent/guardian may apply on their behalf."><Field label="Applicant type"><select required value={form.applicantType} onChange={e => update('applicantType', e.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm"><option value="PARENT">Parent or guardian</option><option value="STUDENT">Student</option></select></Field></FormSection>
            <FormSection title="Student information" description="Enter the learner’s names exactly as they appear on school documents."><Grid><Field label="First name"><Input required value={form.studentFirstName} onChange={e => update('studentFirstName', e.target.value)} /></Field><Field label="Last name"><Input required value={form.studentLastName} onChange={e => update('studentLastName', e.target.value)} /></Field><Field label="Date of birth"><Input required type="date" value={form.studentDateOfBirth} onChange={e => update('studentDateOfBirth', e.target.value)} /></Field><Field label="Gender"><select required value={form.studentGender} onChange={e => update('studentGender', e.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm"><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option></select></Field><Field label="Previous school"><Input required value={form.previousSchool} onChange={e => update('previousSchool', e.target.value)} /></Field><Field label="Average marks obtained (%)"><Input required type="number" min="0" max="100" step="0.01" placeholder="Example: 72.5" value={form.averageMarks} onChange={e => update('averageMarks', e.target.value)} /></Field><Field label="Level applying for"><Input required placeholder="Example: Senior 4 / Level 3" value={form.applyingLevel} onChange={e => update('applyingLevel', e.target.value)} /></Field></Grid><Field label="Previous school location"><LocationPicker value={previousSchoolLocation} onChange={setPreviousSchoolLocation} /></Field><Field label="Preferred programme"><select required value={form.preferredProgramme} onChange={e => update('preferredProgramme', e.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm"><option value="">Select a programme</option>{programmes.map(item => <option key={item}>{item}</option>)}</select></Field><Field label="Reason for changing school"><textarea required value={form.transferReason} onChange={e => update('transferReason', e.target.value)} rows={4} className="w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="Briefly explain why the student wishes to transfer to G.S BTR Rwamiko TSS." /></Field></FormSection>
            <FormSection title="Parent or guardian" description="We use these details for admission communication."><Grid><Field label="First name"><Input required value={form.guardianFirstName} onChange={e => update('guardianFirstName', e.target.value)} /></Field><Field label="Last name"><Input required value={form.guardianLastName} onChange={e => update('guardianLastName', e.target.value)} /></Field><Field label="Relationship to student"><Input required placeholder="Mother, father, guardian…" value={form.guardianRelationship} onChange={e => update('guardianRelationship', e.target.value)} /></Field><Field label="Phone number"><Input required type="tel" value={form.guardianPhone} onChange={e => update('guardianPhone', e.target.value)} /></Field><Field label="Email address"><Input required type="email" value={form.guardianEmail} onChange={e => update('guardianEmail', e.target.value)} /></Field></Grid><Field label="Current residence of student or parent"><LocationPicker value={currentResidence} onChange={setCurrentResidence} /></Field></FormSection>
            <FormSection title="Student photo and academic document" description="Upload a clear student photograph and the latest report card or examination result slip."><Grid><label className="flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-cyan-300 bg-cyan-50/60 px-5 py-9 text-center transition hover:bg-cyan-50"><Upload className="size-8 text-cyan-700" /><span className="mt-3 font-bold">{profilePicture ? profilePicture.name : 'Choose student profile picture'}</span><span className="mt-1 text-xs text-muted-foreground">JPG only, maximum 10 MB</span><input required type="file" accept="image/jpeg,.jpg,.jpeg" className="sr-only" onChange={e => setProfilePicture(e.target.files?.[0] ?? null)} /></label><label className="flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-cyan-300 bg-cyan-50/60 px-5 py-9 text-center transition hover:bg-cyan-50"><Upload className="size-8 text-cyan-700" /><span className="mt-3 font-bold">{file ? file.name : 'Choose PDF report card or result slip'}</span><span className="mt-1 text-xs text-muted-foreground">PDF only, maximum 10 MB</span><input required type="file" accept="application/pdf,.pdf" className="sr-only" onChange={e => setFile(e.target.files?.[0] ?? null)} /></label></Grid><Field label="Additional information"><textarea required value={form.notes} onChange={e => update('notes', e.target.value)} rows={4} className="w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="Tell the admission team anything important about this application." /></Field></FormSection>
            {error && <p className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700">{error}</p>}
            <div className="flex flex-col items-center justify-between gap-4 border-t pt-7 sm:flex-row"><p className="flex items-center gap-2 text-xs text-muted-foreground"><FileText className="size-4" /> All required information must be accurate.</p><Button type="submit" size="lg" disabled={submitting} className="w-full rounded-full px-8 sm:w-auto">{submitting ? 'Submitting…' : 'Submit application'}</Button></div>
          </form></CardContent>
        </Card>
      </div>
    </main>
  );
}

function FormSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) { return <section className="space-y-5"><div><h2 className="text-xl font-black">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{description}</p></div>{children}</section>; }
function Grid({ children }: { children: React.ReactNode }) { return <div className="grid gap-5 sm:grid-cols-2">{children}</div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div>; }
function formatLocation(location: LocationPickerValue) { return [location.province, location.district, location.sector, location.cell, location.village].join(', '); }
