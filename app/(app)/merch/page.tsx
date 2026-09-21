import { ShoppingBag } from 'lucide-react';
import { PageWrapper } from '@/components/ui/page-layout';
import { MerchGrid } from '@/features/merch/components/merch-grid';
import { getMerchProducts, isShopifyConfigured } from '@/lib/shopify/storefront';

export default async function MerchPage() {
  const products = isShopifyConfigured() ? await getMerchProducts() : [];
  return (
    <PageWrapper>
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-accent mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em]"><ShoppingBag className="h-4 w-4" /> NextBeats merch</p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Wear the sound.</h1>
          <p className="text-muted mt-2 max-w-xl">Official pieces for the artists, listeners, and late-night sessions behind NextBeats.</p>
        </div>
      </div>
      <MerchGrid products={products} configured={isShopifyConfigured()} />
    </PageWrapper>
  );
}
