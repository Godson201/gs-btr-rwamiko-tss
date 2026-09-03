'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { ExternalLink, FileCheck2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Admission {
  id: string; applicationNo: string; applicantType: string; studentFirstName: string; studentLastName: string;
  applyingLevel: string; preferredProgramme: string; previousSchool: string; previousSchoolLocation: string; transferReason: string; averageMarks: number; guardianFirstName: string;
  guardianLastName: string; guardianEmail: string; guardianPhone: string; resultDocumentUrl: string;
  resultDocumentName: string; profilePictureUrl: string; profilePictureName: string; residence: string; status: 'PENDING' | 'UNDER_REVIEW' | 'ACCEPTED' | 'REJECTED'; createdAt: string;
}

const statuses: Admission['status'][] = ['PENDING', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED'];
const uploadsBase = process.env.NEXT_PUBLIC_UPLOADS_BASE_URL ?? '';

export default function AdminAdmissionsPage() {
  const queryClient = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ['admissions'], queryFn: async () => (await api.get<Admission[]>('/admissions/admin')).data });
  const update = useMutation({ mutationFn: ({ id, status }: { id: string; status: Admission['status'] }) => api.patch(`/admissions/admin/${id}/status`, { status }), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['admissions'] }); toast.success('Application status updated'); }, onError: (error: Error) => toast.error(error.message) });

  return <div className="space-y-6"><div><h2 className="text-2xl font-bold tracking-tight">Admission applications</h2><p className="text-sm text-muted-foreground">Review student and parent submissions and their academic documents.</p></div>
    {isLoading ? <Card><CardContent className="p-8 text-center text-muted-foreground">Loading applications…</CardContent></Card> : data.length === 0 ? <Card><CardContent className="p-10 text-center"><FileCheck2 className="mx-auto size-10 text-muted-foreground" /><p className="mt-3 font-semibold">No admission applications yet</p></CardContent></Card> : <div className="grid gap-5">{data.map(item => <Card key={item.id} className="shadow-md"><CardHeader className="flex-row items-start justify-between gap-4"><div className="flex items-center gap-4"><Image src={`${uploadsBase}${item.profilePictureUrl}`} alt={`${item.studentFirstName} ${item.studentLastName}`} width={64} height={64} className="size-16 rounded-2xl border object-cover" unoptimized /><div><CardTitle>{item.studentFirstName} {item.studentLastName}</CardTitle><p className="mt-1 text-xs text-muted-foreground">{item.applicationNo} • Submitted {new Date(item.createdAt).toLocaleDateString()}</p></div></div><Badge variant={item.status === 'ACCEPTED' ? 'default' : item.status === 'REJECTED' ? 'destructive' : 'secondary'}>{item.status.replace('_', ' ')}</Badge></CardHeader><CardContent className="space-y-5"><div className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4"><Info label="Applying for" value={`${item.applyingLevel} — ${item.preferredProgramme}`} /><Info label="Average marks" value={`${item.averageMarks}%`} /><Info label="Previous school" value={`${item.previousSchool}, ${item.previousSchoolLocation}`} /><Info label="Current residence" value={item.residence} /><Info label="Guardian" value={`${item.guardianFirstName} ${item.guardianLastName}`} /><Info label="Contact" value={`${item.guardianPhone} • ${item.guardianEmail}`} /><div className="sm:col-span-2"><Info label="Reason for transfer" value={item.transferReason} /></div></div><div className="flex flex-wrap items-center justify-between gap-4 border-t pt-4"><Button asChild variant="outline"><a href={`${uploadsBase}${item.resultDocumentUrl}`} target="_blank" rel="noreferrer">View {item.resultDocumentName}<ExternalLink className="size-4" /></a></Button><div className="flex flex-wrap gap-2">{statuses.map(status => <Button key={status} size="sm" variant={item.status === status ? 'default' : 'outline'} disabled={update.isPending || item.status === status} onClick={() => update.mutate({ id: item.id, status })}>{status.replace('_', ' ')}</Button>)}</div></div></CardContent></Card>)}</div>}
  </div>;
}

function Info({ label, value }: { label: string; value: string }) { return <div><p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 font-medium">{value}</p></div>; }
