import { ShoppingBag } from 'lucide-react';
import { PageWrapper } from '@/components/ui/page-layout';
import { MerchGrid } from '@/features/merch/components/merch-grid';
import { getMerchProducts, isShopifyConfigured } from '@/lib/shopify/storefront';

export default async function MerchPage() {
  const products = isShopifyConfigured() ? await getMerchProducts() : [];
  return (
    <PageWrapper>
      <div className="mb-6 flex items-end justify-between gap-4 sm:mb-8">
        <div className="min-w-0">
          <p className="text-accent mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em]"><ShoppingBag className="h-4 w-4" /> Neurodiversity Nation shop</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">Wear the movement.</h1>
          <p className="text-muted mt-2 max-w-xl text-sm sm:text-base">Official pieces made for the listeners, advocates, and community behind every voice.</p>
        </div>
      </div>
      <MerchGrid products={products} configured={isShopifyConfigured()} />
    </PageWrapper>
  );
}
