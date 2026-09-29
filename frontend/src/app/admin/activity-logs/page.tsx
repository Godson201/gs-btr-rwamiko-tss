import { redirect } from 'next/navigation';

export default function ActivityLogsPage() {
  redirect('/admin/settings#activity-logs');
}
