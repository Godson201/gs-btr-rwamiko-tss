'use client';

import { ProfileForm } from '@/components/shared/profile-form';
import { useAuth } from '@/contexts/auth-context';

export default function ParentProfilePage() {
  const { user, isLoading } = useAuth();

  if (isLoading || !user) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Profile</h1>
        <p className="text-sm text-muted-foreground">Manage your personal details and photo.</p>
      </div>
      <ProfileForm key={user.id} />
    </div>
  );
}
