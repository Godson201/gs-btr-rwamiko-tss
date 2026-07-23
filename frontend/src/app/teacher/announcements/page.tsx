import { AnnouncementFeed } from '@/components/shared/announcement-feed';

export default function TeacherAnnouncementsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Announcements</h2>
        <p className="text-sm text-muted-foreground">Updates from the administration</p>
      </div>
      <AnnouncementFeed />
    </div>
  );
}
