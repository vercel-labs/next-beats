import { Search, Tag } from 'lucide-react';
import { PageWrapper } from '@/components/ui/page-layout';
import { PodcastSearch } from '@/features/podcast/components/podcast-search';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  description: 'Discover and listen to podcasts from Spreaker.',
  title: 'Podcasts',
};

export default function PodcastsPage() {
  return (
    <PageWrapper>
      <header className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-accent mb-2 text-xs font-bold uppercase tracking-[0.18em]">Spreaker catalog</p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Podcasts</h1>
          <p className="text-muted mt-2 max-w-xl text-sm sm:text-base">Find shows and play the latest episodes from creators you want to hear.</p>
        </div>
      </header>
      <section id="discover">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div><p className="text-muted text-xs font-semibold uppercase tracking-[0.16em]">Explore the catalog</p><h2 className="mt-1 text-2xl font-bold">Find a show</h2></div>
          <p className="text-muted hidden text-sm sm:block">Search shows, hosts, or topics.</p>
        </div>
        <form action="/search" className="mb-8 flex gap-2">
          <label htmlFor="podcast-search" className="sr-only">Search Spreaker podcasts</label>
          <input id="podcast-search" name="q" placeholder="Search podcasts, hosts, or topics" className="min-h-12" />
          <button type="submit" className="bg-accent text-accent-foreground inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold sm:px-5"><Search className="h-4 w-4" /><span className="hidden sm:inline">Search</span></button>
        </form>
        <div className="mb-10">
          <div className="mb-4 flex items-center gap-2"><Tag className="h-4 w-4 text-accent" /><h3 className="font-semibold">Browse by category</h3></div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {['News', 'True crime', 'Comedy', 'Business', 'Sports', 'Culture', 'Technology'].map(category => <a key={category} href={`/search?q=${encodeURIComponent(category)}`} className="bg-card dark:bg-card-dark hover:bg-accent hover:text-accent-foreground shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors">{category}</a>)}
          </div>
        </div>
        <div className="mb-10">
          <div className="mb-4 flex items-end justify-between gap-4"><div><p className="text-muted text-xs font-semibold uppercase tracking-[0.16em]">Latest from Spreaker</p><h3 className="mt-1 text-2xl font-bold">Recent episodes</h3></div><span className="text-muted hidden text-sm sm:block">New conversations to explore</span></div>
          <PodcastSearch query="latest" />
        </div>
        <div>
          <div className="mb-4"><p className="text-muted text-xs font-semibold uppercase tracking-[0.16em]">Your starting point</p><h3 className="mt-1 text-2xl font-bold">Popular podcasts</h3></div>
          <PodcastSearch query="podcast" />
        </div>
      </section>
    </PageWrapper>
  );
}
