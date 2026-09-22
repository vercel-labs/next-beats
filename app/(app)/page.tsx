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
      <section className="relative mb-10 overflow-hidden rounded-3xl bg-[#171717] p-6 shadow-2xl sm:p-10">
        <div className="absolute -right-20 -top-28 h-72 w-72 rounded-full bg-accent/25 blur-3xl" aria-hidden="true" />
        <div className="absolute bottom-0 right-0 h-40 w-40 rounded-full bg-accent/10 blur-2xl" aria-hidden="true" />
        <div className="relative max-w-3xl">
          <p className="text-accent mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em]"><Headphones className="h-4 w-4" /> Your podcast home</p>
          <h1 className="max-w-2xl text-4xl font-black leading-[0.98] tracking-[-0.04em] text-white sm:text-6xl">Stories that make room for every voice.</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/60">Listen to Neurodiversity Nation, discover new conversations, and shop the collection built around the community.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/podcasts" className="bg-accent text-black inline-flex items-center rounded-full px-6 py-3 text-sm font-bold transition-transform hover:scale-[1.02]">Play the latest episode</Link>
            <Link href="/merch" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-6 py-3 text-sm font-bold text-white"><ShoppingBag className="h-4 w-4" /> Shop collection</Link>
          </div>
        </div>
      </section>
      <section className="mb-10">
        <div className="mb-5 flex items-end justify-between gap-4"><div><p className="text-muted text-xs font-bold uppercase tracking-[0.18em]">Continue listening</p><h2 className="mt-1 text-2xl font-bold">Featured podcast</h2></div><Link href="/podcasts" className="text-accent text-sm font-bold">Open show</Link></div>
        <div className="bg-card dark:bg-card-dark rounded-2xl p-4 sm:p-5"><PodcastSearch query="Neurodiversity Nation" /></div>
      </section>
      <RecentPodcastCategories />
      <section className="mt-10">
        <div className="mb-5 flex items-end justify-between gap-4"><div><p className="text-muted text-xs font-bold uppercase tracking-[0.18em]">From the store</p><h2 className="mt-1 text-2xl font-bold">Featured collection</h2></div><Link href="/merch" className="text-accent text-sm font-bold">View all</Link></div>
        <MerchGrid products={products.slice(0, 4)} configured={isShopifyConfigured()} />
      </section>
    </PageWrapper>
  );
}
