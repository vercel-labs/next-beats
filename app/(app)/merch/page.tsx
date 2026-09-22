import { ShoppingBag } from 'lucide-react';
import { PageWrapper } from '@/components/ui/page-layout';
import { MerchGrid } from '@/features/merch/components/merch-grid';
import { getMerchProducts, isShopifyConfigured } from '@/lib/shopify/storefront';

export default async function MerchPage() {
  const products = isShopifyConfigured() ? await getMerchProducts() : [];
  return (
    <PageWrapper>
      <section className="relative mb-8 overflow-hidden rounded-3xl bg-[#171717] p-6 text-white sm:mb-10 sm:p-10">
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-accent/25 blur-3xl" aria-hidden="true" />
        <div className="relative max-w-2xl">
          <p className="text-accent mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em]"><ShoppingBag className="h-4 w-4" /> Neurodiversity Nation shop</p>
          <h1 className="text-4xl font-black tracking-[-0.04em] sm:text-6xl">Wear the movement.</h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-white/65 sm:text-base">Official pieces for listeners, advocates, families, and every person making room for a more inclusive world.</p>
        </div>
      </section>
      <div className="mb-6 flex flex-wrap gap-2" aria-label="Shop categories">
        {['All pieces', 'Apparel', 'Accessories', 'Community favorites'].map((category, index) => <button key={category} type="button" className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${index === 0 ? 'bg-accent text-black' : 'bg-card dark:bg-card-dark text-muted hover:text-foreground'}`}>{category}</button>)}
      </div>
      <MerchGrid products={products} configured={isShopifyConfigured()} />
    </PageWrapper>
  );
}
