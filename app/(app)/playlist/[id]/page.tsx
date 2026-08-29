import { PageWrapper } from '@/components/ui/page-layout';

export default function PlaylistDetailPage(_props: PageProps<'/playlist/[id]'>) {
  return (
    <PageWrapper>
      {/* Playlist detail */}

      <section className="mt-10">
        <h2 className="mb-4">Other Playlists</h2>
        {/* Other Playlists */}
      </section>
    </PageWrapper>
  );
}
