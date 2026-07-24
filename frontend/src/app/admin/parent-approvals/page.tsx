'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { api } from '@/lib/api';

type ParentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

interface ParentApproval {
  id: string;
  status: ParentStatus;
  claimedStudentName: string | null;
  claimedAdmissionNo: string | null;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    createdAt: string;
    residenceLocation: { province: string; district: string; sector: string; cell: string; village: string } | null;
  };
  requestedStudent: {
    id: string;
    admissionNo: string;
    parentId: string | null;
    user: { firstName: string; lastName: string };
  } | null;
}

function formatLocation(location: ParentApproval['user']['residenceLocation']) {
  if (!location) return '—';
  return `${location.village}, ${location.cell}, ${location.sector}, ${location.district}, ${location.province}`;
}

export default function ParentApprovalsPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<ParentStatus>('PENDING');

  const { data, isLoading } = useQuery({
    queryKey: ['parent-approvals', status],
    queryFn: async () => (await api.get<ParentApproval[]>('/parents/approvals', { params: { status } })).data,
  });

  const approve = useMutation({
    mutationFn: async (id: string) => api.post<{ studentLinkWarning: string | null }>(`/parents/approvals/${id}/approve`),
    onSuccess: (response) => {
      toast.success('Parent approved');
      if (response.data.studentLinkWarning) {
        toast.warning(response.data.studentLinkWarning);
      }
      queryClient.invalidateQueries({ queryKey: ['parent-approvals'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const reject = useMutation({
    mutationFn: async (id: string) => api.post(`/parents/approvals/${id}/reject`),
    onSuccess: () => {
      toast.success('Parent registration declined');
      queryClient.invalidateQueries({ queryKey: ['parent-approvals'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const columns: DataTableColumn<ParentApproval>[] = [
    {
      header: 'Parent',
      cell: (row) => (
        <div>
          <div className="font-medium">
            {row.user.firstName} {row.user.lastName}
          </div>
          <div className="text-xs text-muted-foreground">{row.user.email}</div>
          {row.user.phone && <div className="text-xs text-muted-foreground">{row.user.phone}</div>}
        </div>
      ),
    },
    {
      header: 'Student',
      cell: (row) =>
        row.requestedStudent ? (
          <div>
            <Badge variant="default">Matched</Badge>
            <div className="mt-1 text-sm">
              {row.requestedStudent.user.firstName} {row.requestedStudent.user.lastName} (
              {row.requestedStudent.admissionNo})
            </div>
          </div>
        ) : (
          <div>
            <Badge variant="warning">Unverified claim</Badge>
            <div className="mt-1 text-sm">
              {row.claimedStudentName ?? '—'} {row.claimedAdmissionNo ? `(${row.claimedAdmissionNo})` : ''}
            </div>
          </div>
        ),
    },
    { header: 'Residence', cell: (row) => <span className="text-sm">{formatLocation(row.user.residenceLocation)}</span> },
    {
      header: 'Registered',
      cell: (row) => <span className="text-sm">{new Date(row.createdAt).toLocaleDateString()}</span>,
    },
    {
      header: '',
      className: 'text-right',
      cell: (row) =>
        row.status === 'PENDING' ? (
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => reject.mutate(row.id)} disabled={reject.isPending}>
              <X className="size-4" />
              Decline
            </Button>
            <Button size="sm" onClick={() => approve.mutate(row.id)} disabled={approve.isPending}>
              <Check className="size-4" />
              Approve
            </Button>
          </div>
        ) : (
          <Badge variant={row.status === 'APPROVED' ? 'default' : 'destructive'}>{row.status}</Badge>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Parent Approvals</h2>
          <p className="text-sm text-muted-foreground">
            Verify that new parent registrations are real and have a student enrolled here.
          </p>
        </div>
        <Select value={status} onValueChange={(value) => setStatus(value as ParentStatus)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={data ?? []}
        isLoading={isLoading}
        getRowKey={(row) => row.id}
        emptyMessage="No parent registrations here."
      />
    </div>
  );
}
