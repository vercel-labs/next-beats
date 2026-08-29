import { PageWrapper } from '@/components/ui/page-layout';

export default function HomePage() {
  return (
    <PageWrapper title="Welcome back">
      <h2 className="mb-4">Recently Played</h2>
      {/* Recently Played */}

      <h2 className="mt-10 mb-4">Most Played</h2>
      {/* Most Played */}

      <section className="mt-10">
        <h2 className="mb-4">Your Playlists</h2>
        {/* Your Playlists */}
      </section>

      <section className="mt-10">
        <h2 className="mb-4">Browse Genres</h2>
        {/* Browse Genres */}
      </section>
    </PageWrapper>
  );
}
