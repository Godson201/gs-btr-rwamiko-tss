'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ClipboardClock, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface AuditEntry {
  id: string; action: string; method: string | null; resource: string | null;
  resourceId: string | null; statusCode: number | null; createdAt: string;
  actorName: string | null; actorEmail: string | null; actorRole: string | null;
  ipAddress: string | null; userAgent: string | null; details: string | null;
  user: { firstName: string; lastName: string; email: string; role: string } | null;
}
interface AuditResult { items: AuditEntry[]; total: number; page: number; limit: number }
const emptyFilters = { search: '', method: '', outcome: '', from: '', to: '' };

function actorName(entry: AuditEntry) {
  return entry.actorName || (entry.user ? `${entry.user.firstName} ${entry.user.lastName}` : 'Unauthenticated / unknown');
}
function outcome(entry: AuditEntry) {
  return entry.statusCode === null ? 'Not recorded' : entry.statusCode < 400 ? 'Success' : 'Failed';
}

function activityLabel(entry: AuditEntry) {
  const authActions: Record<string, string> = {
    'POST /api/auth/login': 'Sign in', 'POST /api/auth/logout': 'Sign out',
    'POST /api/auth/register': 'Create user account',
    'POST /api/auth/register-parent': 'Register parent account',
    'POST /api/auth/forgot-password': 'Request password reset',
    'POST /api/auth/reset-password': 'Set new password',
  };
  const verbs: Record<string, string> = { GET: 'View', POST: 'Submit', PATCH: 'Update', PUT: 'Update', DELETE: 'Delete' };
  return authActions[entry.action] || (entry.method && entry.resource
    ? `${verbs[entry.method] || entry.method} ${entry.resource.replaceAll('-', ' ')}` : entry.action);
}

export function ActivityLogs({ compact = false }: { compact?: boolean }) {
  const [draft, setDraft] = useState(emptyFilters);
  const [filters, setFilters] = useState(emptyFilters);
  const [page, setPage] = useState(1);
  const [snapshot, setSnapshot] = useState(() => new Date().toISOString());
  const [selected, setSelected] = useState<AuditEntry | null>(null);
  const [filterError, setFilterError] = useState('');
  const limit = compact ? 5 : 25;
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['audit-logs', filters, page, limit, snapshot],
    queryFn: async () => {
      const end = filters.to ? new Date(`${filters.to}T23:59:59.999`).toISOString() : snapshot;
      return (await api.get<AuditResult>('/audit-logs', { params: {
        page, limit, search: filters.search || undefined, method: filters.method || undefined,
        outcome: filters.outcome || undefined,
        from: filters.from ? new Date(`${filters.from}T00:00:00`).toISOString() : undefined,
        to: end < snapshot ? end : snapshot,
      } })).data;
    },
  });
  function apply(event: FormEvent) {
    event.preventDefault();
    if (draft.from && draft.to && draft.from > draft.to) {
      setFilterError('Choose an end date on or after the start date.'); return;
    }
    setFilterError(''); setFilters({ ...draft, search: draft.search.trim() });
    setPage(1); setSnapshot(new Date().toISOString());
  }
  const pages = Math.max(1, Math.ceil((data?.total ?? 0) / limit));

  return <Card>
    <CardHeader>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><CardTitle className="flex items-center gap-2"><ClipboardClock className="size-5" />{compact ? 'Recent activity' : 'Activity logs'}</CardTitle>
          <p className="mt-2 text-sm text-muted-foreground">{compact ? 'Latest recorded school portal activity.' : 'Audit users, requests, changes and sign-in attempts across the school portal.'}</p></div>
        {compact ? <Button asChild variant="outline"><Link href="/admin/activity-logs">View all logs</Link></Button> :
          <Button variant="outline" disabled={isFetching} onClick={() => { setPage(1); setSnapshot(new Date().toISOString()); }}><RefreshCw className={isFetching ? 'animate-spin' : ''} />Refresh</Button>}
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      {!compact && <>
        <p className="text-sm text-muted-foreground">Records begin when activity logging is enabled. Passwords, tokens and request contents are excluded. Dates use your local time.</p>
        <form onSubmit={apply} className="grid gap-3 rounded-lg border bg-muted/30 p-3 sm:grid-cols-2 xl:grid-cols-3">
          <label className="space-y-1 text-sm font-medium">Search<Input placeholder="User, email, action or record ID" maxLength={200} value={draft.search} onChange={e => setDraft({ ...draft, search: e.target.value })} /></label>
          <label className="space-y-1 text-sm font-medium">Action<select aria-label="Action" className="h-11 w-full rounded-md border bg-background px-3" value={draft.method} onChange={e => setDraft({ ...draft, method: e.target.value })}>
            <option value="">All actions</option><option value="GET">View / read</option><option value="POST">Create / submit / sign in</option><option value="PATCH">Update (PATCH)</option><option value="PUT">Update (PUT)</option><option value="DELETE">Delete</option>
          </select></label>
          <label className="space-y-1 text-sm font-medium">Result<select aria-label="Result" className="h-11 w-full rounded-md border bg-background px-3" value={draft.outcome} onChange={e => setDraft({ ...draft, outcome: e.target.value })}><option value="">All results</option><option value="success">Success</option><option value="failure">Failed</option></select></label>
          <label className="space-y-1 text-sm font-medium">From<Input type="date" value={draft.from} onChange={e => setDraft({ ...draft, from: e.target.value })} /></label>
          <label className="space-y-1 text-sm font-medium">To<Input type="date" value={draft.to} onChange={e => setDraft({ ...draft, to: e.target.value })} /></label>
          <div className="flex flex-wrap items-end gap-2"><Button type="submit">Apply filters</Button><Button type="button" variant="ghost" onClick={() => { setDraft(emptyFilters); setFilters(emptyFilters); setPage(1); setFilterError(''); setSnapshot(new Date().toISOString()); }}>Clear</Button></div>
          {filterError && <p role="alert" className="text-sm text-destructive sm:col-span-2">{filterError}</p>}
        </form>
      </>}
      {error ? <div role="alert" className="rounded-md border p-4"><p>Activity logs could not be loaded.</p><Button variant="outline" className="mt-2" onClick={() => refetch()}>Try again</Button></div> : isLoading ? <p role="status" className="py-6 text-center text-muted-foreground">Loading activity logs…</p> : !data?.items.length ? <p className="py-6 text-center text-muted-foreground">No activity logs match this view.</p> : <>
        <ul className="divide-y rounded-lg border">
          {data.items.map(entry => <li key={entry.id} className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
            <div className="min-w-0 space-y-1 wrap-anywhere">
              <p className="font-medium">{actorName(entry)}</p>
              <p className="text-xs text-muted-foreground">{entry.actorEmail || entry.user?.email}{(entry.actorRole || entry.user?.role) && ` · ${entry.actorRole || entry.user?.role}`}</p>
              <p className="text-sm">{activityLabel(entry)}</p>
              {entry.resourceId && <p className="text-xs text-muted-foreground">Record: {entry.resourceId}</p>}
              <time className="block text-xs text-muted-foreground" dateTime={entry.createdAt}>{new Date(entry.createdAt).toLocaleString()}</time>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className={`rounded-full px-2 py-1 text-xs font-medium ${entry.statusCode === null ? 'bg-muted' : entry.statusCode < 400 ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>{outcome(entry)}{entry.statusCode !== null ? ` · ${entry.statusCode}` : ''}</span>
              <Button variant="outline" size="sm" onClick={() => setSelected(entry)} aria-label={`View details for ${entry.action} by ${actorName(entry)}`}>Details</Button>
            </div>
          </li>)}
        </ul>
        {!compact && <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">{data.total.toLocaleString()} records · Page {page} of {pages}</p>
          <div className="flex gap-2"><Button variant="outline" disabled={page <= 1 || isFetching} onClick={() => setPage(p => p - 1)}>Previous</Button><Button variant="outline" disabled={page >= pages || isFetching} onClick={() => setPage(p => p + 1)}>Next</Button></div>
        </div>}
      </>}
      <Dialog open={!!selected} onOpenChange={open => { if (!open) setSelected(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Activity details</DialogTitle><DialogDescription>Recorded request metadata. Network address may identify the application proxy.</DialogDescription></DialogHeader>
          {selected && <dl className="grid gap-3 text-sm wrap-anywhere">
            {Object.entries({ 'Log ID': selected.id, 'Time': new Date(selected.createdAt).toLocaleString(), 'User': actorName(selected), 'Email': selected.actorEmail || selected.user?.email, 'Role': selected.actorRole || selected.user?.role, 'Action': selected.action, 'Record ID': selected.resourceId, 'Result': `${outcome(selected)}${selected.statusCode !== null ? ` (${selected.statusCode})` : ''}`, 'Network address': selected.ipAddress, 'Browser / client': selected.userAgent, 'Details': selected.details }).map(([label, value]) => <div key={label}><dt className="font-medium text-muted-foreground">{label}</dt><dd className="mt-1 whitespace-pre-wrap">{value || 'Not recorded'}</dd></div>)}
          </dl>}
        </DialogContent>
      </Dialog>
    </CardContent>
  </Card>;
}
