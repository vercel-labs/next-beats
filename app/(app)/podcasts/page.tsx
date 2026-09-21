import { Headphones, Search, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
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
      <div className="relative overflow-hidden rounded-3xl bg-[#181818] px-5 py-8 text-white shadow-sm sm:px-8 sm:py-10">
        <div className="absolute -right-12 -top-16 h-52 w-52 rounded-full bg-accent/25 blur-3xl" aria-hidden="true" />
        <div className="relative max-w-2xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-white/75">
            <Headphones className="h-3.5 w-3.5" /> Spreaker podcasts
          </div>
          <h1 className="max-w-xl text-3xl font-bold tracking-tight text-white sm:text-5xl">Your next listen is already here.</h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-white/65 sm:text-base">Discover shows, follow the story, and play every episode without leaving NextBeats.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#discover" className="bg-accent text-accent-foreground inline-flex min-h-11 items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"><Search className="h-4 w-4" /> Discover shows</a>
            <Link href="/merch" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white"><ShoppingBag className="h-4 w-4" /> Visit merch</Link>
          </div>
        </div>
      </div>
      <section id="discover" className="mt-9">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div><p className="text-muted text-xs font-semibold uppercase tracking-[0.16em]">Explore the catalog</p><h2 className="mt-1 text-2xl font-bold">Find a show</h2></div>
          <p className="text-muted hidden text-sm sm:block">Search by show, host, or topic.</p>
        </div>
        <form action="/search" className="mb-8 flex gap-2">
          <label htmlFor="podcast-search" className="sr-only">Search Spreaker podcasts</label>
          <input id="podcast-search" name="q" placeholder="Search podcasts, hosts, or topics" className="min-h-12" />
          <button type="submit" className="bg-accent text-accent-foreground inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold sm:px-5"><Search className="h-4 w-4" /><span className="hidden sm:inline">Search</span></button>
        </form>
        <PodcastSearch query="podcast" />
      </section>
    </PageWrapper>
  );
}
