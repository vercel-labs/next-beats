import { AnimatedSuspense } from '@/components/ui/animated-suspense';
import { PageWrapper } from '@/components/ui/page-layout';
import { CreatePlaylistForm } from '@/features/playlist/components/create-playlist-form';
import { PlaylistBrowse } from '@/features/playlist/components/playlist-browse';
import { PlaylistListSkeleton } from '@/features/playlist/components/playlist-card';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Playlists',
};

export default function PlaylistsPage() {
  return (
    <PageWrapper title="Playlists">
      <div className="mb-6 max-w-md">
        <CreatePlaylistForm />
      </div>
      <AnimatedSuspense>
        <PlaylistBrowse animateItems />
      </AnimatedSuspense>
    </PageWrapper>
  );
}
