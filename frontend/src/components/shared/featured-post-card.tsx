import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AttachmentPreview, type AttachmentLike } from '@/components/shared/attachment-preview';
import { authorByline, type PostAuthor } from '@/lib/staff-title';
import { CATEGORY_LABEL, type AnnouncementCategory } from '@/lib/announcement-constants';

export interface FeaturedPost {
  id: string;
  title: string;
  content: string;
  type: AnnouncementCategory;
  publishedAt: string | null;
  createdAt: string;
  author: PostAuthor;
  attachments: AttachmentLike[];
}

export function FeaturedPostCard({ item, children }: { item: FeaturedPost; children?: React.ReactNode }) {
  const hero = item.attachments.find((a) => a.type === 'IMAGE') ?? item.attachments.find((a) => a.type === 'VIDEO');
  const byline = authorByline(item.author);

  return (
    <Card className="overflow-hidden border-primary/30">
      {hero && (
        <div className="max-h-80 w-full overflow-hidden">
          <AttachmentPreview attachment={hero} className="aspect-[21/9] w-full" />
        </div>
      )}
      <CardContent className="space-y-3 p-6">
        <div className="flex items-center gap-2">
          <Badge>Featured</Badge>
          <Badge variant="secondary">{CATEGORY_LABEL[item.type]}</Badge>
          <span className="text-xs text-muted-foreground">
            {new Date(item.publishedAt ?? item.createdAt).toLocaleDateString()}
          </span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight">{item.title}</h2>
        <p className="text-sm text-muted-foreground">
          By {item.author.firstName} {item.author.lastName}
          {byline ? ` — ${byline}` : ''}
        </p>
        <p className="whitespace-pre-wrap text-sm">{item.content}</p>
        {item.attachments.length > (hero ? 1 : 0) && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {item.attachments.filter((a) => a.id !== hero?.id).map((attachment) => (
              <AttachmentPreview key={attachment.id} attachment={attachment} />
            ))}
          </div>
        )}
        {children}
      </CardContent>
    </Card>
  );
}
