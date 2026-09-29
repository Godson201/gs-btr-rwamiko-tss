'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { Megaphone } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { AttachmentPreview, type AttachmentLike } from './attachment-preview';
import { CATEGORY_LABEL, type AnnouncementCategory } from '@/lib/announcement-constants';

interface SchoolUpdate {
  id: string; title: string; content: string; type: AnnouncementCategory;
  publishedAt: string; attachments: AttachmentLike[];
}
interface UpdatesPage { items: SchoolUpdate[]; hasMore: boolean }

export function SchoolUpdates() {
  const { data, isLoading, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['public-school-updates'], initialPageParam: 1,
    queryFn: async ({ pageParam }) => (await api.get<UpdatesPage>('/public/school-updates', { params: { page: pageParam } })).data,
    getNextPageParam: (lastPage, pages) => lastPage.hasMore ? pages.length + 1 : undefined,
    staleTime: 0,
  });
  const items = data?.pages.flatMap(page => page.items) ?? [];
  return <section id="school-updates" className="scroll-mt-8 border-b border-slate-200 bg-white px-5 py-16 sm:px-8">
    <div className="mx-auto max-w-7xl">
      <p className="text-xs font-black uppercase tracking-widest text-cyan-700">From our school</p>
      <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">School updates</h2>
      <p className="mt-3 text-slate-600">News, announcements and moments from G.S BTR Rwamiko TSS.</p>
      {isLoading && <p role="status" className="mt-8 text-slate-600">Loading school updates…</p>}
      {error && <div role="alert" className="mt-8"><p>School updates are temporarily unavailable.</p><Button variant="outline" className="mt-3" onClick={() => refetch()}>Try again</Button></div>}
      {!isLoading && !error && !items.length && <p className="mt-8 rounded-xl bg-slate-50 p-6 text-slate-600">School updates will appear here when published.</p>}
      <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {items.map(item => {
          const hero = item.attachments.find(file => file.type === 'IMAGE' || file.type === 'VIDEO');
          return <article key={item.id} className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {hero ? <AttachmentPreview attachment={hero} /> : <div className="flex aspect-video items-center justify-center bg-cyan-50"><Megaphone className="size-12 text-cyan-700" aria-hidden="true" /></div>}
            <div className="space-y-3 p-5 wrap-anywhere">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500"><span className="rounded-full bg-cyan-50 px-2 py-1 font-semibold text-cyan-800">{CATEGORY_LABEL[item.type]}</span><time dateTime={item.publishedAt}>{new Date(item.publishedAt).toLocaleDateString()}</time></div>
              <h3 className="text-xl font-bold">{item.title}</h3>
              {item.content.length > 280 ? <details><summary className="cursor-pointer text-sm font-semibold text-cyan-800">Read announcement</summary><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{item.content}</p></details> : <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">{item.content}</p>}
              {item.attachments.length > (hero ? 1 : 0) && <div className="grid gap-2 sm:grid-cols-2">
                {item.attachments.filter(file => file.id !== hero?.id).map(file => <AttachmentPreview key={file.id} attachment={file} />)}
              </div>}
            </div>
          </article>;
        })}
      </div>
      {hasNextPage && <div className="mt-8 text-center"><Button variant="outline" disabled={isFetchingNextPage} onClick={() => fetchNextPage()}>{isFetchingNextPage ? 'Loading…' : 'More school updates'}</Button></div>}
    </div>
  </section>;
}
