'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import { authorByline, type PostAuthor } from '@/lib/staff-title';

import { mediaUrl } from '@/lib/media-url';

interface FeaturedFeedItem {
  id: string;
  title: string;
  author: PostAuthor;
  attachments: { id: string; url: string; type: string }[];
}

export function FeaturedPostsWidget({ viewAllHref }: { viewAllHref: string }) {
  const { data } = useQuery({
    queryKey: ['featured-posts-widget'],
    queryFn: async () => (await api.get<FeaturedFeedItem[]>('/announcements/feed?featuredOnly=true')).data,
  });

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold">Featured Posts</h3>
          <Link href={viewAllHref} className="text-xs text-primary hover:underline">
            View all
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {data.slice(0, 3).map((item) => {
            const hero = item.attachments.find((a) => a.type === 'IMAGE');
            const byline = authorByline(item.author);
            return (
              <Link
                key={item.id}
                href={viewAllHref}
                className="flex items-center gap-3 rounded-md border p-2 text-sm hover:bg-accent sm:flex-col sm:items-stretch"
              >
                {hero ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mediaUrl(hero.url)}
                    alt=""
                    className="aspect-video w-20 shrink-0 rounded-md object-cover sm:w-full"
                  />
                ) : (
                  <div className="aspect-video w-20 shrink-0 rounded-md bg-secondary sm:w-full" />
                )}
                <div>
                  <p className="line-clamp-2 font-medium">{item.title}</p>
                  {byline && <p className="text-xs text-muted-foreground">{byline}</p>}
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
