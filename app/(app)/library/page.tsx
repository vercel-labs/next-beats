import { Plus } from 'lucide-react';
import { Suspense } from 'react';
import { AnimatedSuspense } from '@/components/ui/animated-suspense';
import { IconButtonLink, IconButtonLinkSkeleton } from '@/components/ui/icon-button-link';
import { PageWrapper } from '@/components/ui/page-layout';
import { TopGenresGrid } from '@/features/genre/components/genre-browse';
import { PlaylistBrowse } from '@/features/playlist/components/playlist-browse';
import { LibraryGrid, LibraryGridSkeleton } from '@/features/track/components/library-grid';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Library',
};

export default function LibraryPage() {
  return (
    <PageWrapper title="Library">
      <section className="relative mb-8 overflow-hidden rounded-3xl bg-[#171717] p-6 text-white sm:p-8">
        <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-accent/25 blur-3xl" aria-hidden="true" />
        <div className="relative max-w-2xl"><p className="text-accent text-xs font-bold uppercase tracking-[0.18em]">Your listening space</p><h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Keep the conversations close.</h1><p className="mt-3 text-sm leading-6 text-white/65">Your saved tracks, playlists, and discovery tools in one calm, accessible home.</p></div>
      </section>
      <h2 className="mb-4">All Tracks</h2>
      <AnimatedSuspense fallback={<LibraryGridSkeleton />}>
        <div className="mb-10">
          <LibraryGrid />
        </div>
        <section className="mb-10">
          <div className="mb-4 flex items-center gap-2">
            <h2>Your Playlists</h2>
            <Suspense fallback={<IconButtonLinkSkeleton />}>
              <IconButtonLink href="/playlist" label="Create playlist">
                <Plus className="h-5 w-5" />
              </IconButtonLink>
            </Suspense>
          </div>
          <PlaylistBrowse />
        </section>
        <section>
          <h2 className="mb-4">Genres</h2>
          <TopGenresGrid />
        </section>
      </AnimatedSuspense>
    </PageWrapper>
  );
}
