import { Headphones, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { PageWrapper } from '@/components/ui/page-layout';
import { MerchGrid } from '@/features/merch/components/merch-grid';
import { PodcastSearch } from '@/features/podcast/components/podcast-search';
import { RecentPodcastCategories } from '@/features/podcast/components/recent-podcast-categories';
import { getMerchProducts, isShopifyConfigured } from '@/lib/shopify/storefront';

export default async function HomePage() {
  const products = isShopifyConfigured() ? await getMerchProducts() : [];

  return (
    <PageWrapper title="Neurodiversity Nation: Amplifying Voices">
      <section className="bg-card dark:bg-card-dark mb-8 rounded-2xl p-6 sm:p-8">
        <p className="text-accent mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em]"><Headphones className="h-4 w-4" /> Podcast & commerce</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">Listen to what&apos;s next.</h1>
        <p className="text-muted mt-3 max-w-xl">Discover public podcasts, play episodes inside NextBeats, and shop official drops in one focused experience.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/podcasts" className="bg-accent text-accent-foreground rounded-full px-5 py-2.5 text-sm font-semibold">Explore podcasts</Link>
          <Link href="/merch" className="border-divider dark:border-divider-dark inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold"><ShoppingBag className="h-4 w-4" /> Shop merch</Link>
        </div>
      </section>
      <RecentPodcastCategories />
      <section className="mb-10">
        <div className="mb-4 flex items-center justify-between gap-3"><h2>Find a podcast</h2><Link href="/search" className="text-accent text-sm font-semibold">Search all</Link></div>
        <PodcastSearch query="Neurodiversity Nation" />
      </section>
      <section>
        <div className="mb-4 flex items-center justify-between gap-3"><h2>Featured merch</h2><Link href="/merch" className="text-accent text-sm font-semibold">View catalog</Link></div>
        <MerchGrid products={products.slice(0, 4)} configured={isShopifyConfigured()} />
      </section>
    </PageWrapper>
  );
}
