import { AnnouncementFeed } from '@/components/shared/announcement-feed';

export default function ParentAnnouncementsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Announcements</h2>
        <p className="text-sm text-muted-foreground">Updates from the school</p>
      </div>
      <AnnouncementFeed />
    </div>
  );
}
