'use client';

import { ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import type { ShopifyProduct } from '@/lib/shopify/storefront';

export function MerchGrid({ products, configured }: { products: ShopifyProduct[]; configured: boolean }) {
  const [status, setStatus] = useState<string | null>(null);

  async function addToCart(product: ShopifyProduct) {
    setStatus(`Adding ${product.title}…`);
    const response = await fetch('/api/shopify/cart', { body: JSON.stringify({ merchandiseId: product.variantId, quantity: 1 }), headers: { 'Content-Type': 'application/json' }, method: 'POST' });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) { setStatus(payload.error ?? 'Unable to add that item.'); return; }
    setStatus(`${product.title} added to your bag.`);
  }

  if (!configured) return <div className="bg-card dark:bg-card-dark rounded-2xl p-8 text-center"><ShoppingBag className="text-accent mx-auto mb-3 h-8 w-8" /><h2 className="text-xl font-bold">The collection is coming soon</h2><p className="text-muted mt-2">The Neurodiversity Nation catalog will be available here soon.</p></div>;
  if (!products.length) return <div className="bg-card dark:bg-card-dark rounded-2xl p-8 text-center"><h2 className="text-xl font-bold">The shop is getting ready</h2><p className="text-muted mt-2">No products are available yet.</p></div>;

  return <>
    {status && <p role="status" className="text-muted mb-4 text-sm">{status} <a href="/cart" className="text-accent font-semibold underline">View bag</a></p>}
    <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
      {products.map(product => <article key={product.id} className="group bg-card dark:bg-card-dark overflow-hidden rounded-2xl">
        <div className="bg-accent/10 aspect-square overflow-hidden">{product.featuredImage ? <Image src={product.featuredImage.url} alt={product.featuredImage.altText ?? product.title} width={720} height={720} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" unoptimized /> : <div className="flex h-full items-center justify-center"><ShoppingBag className="text-accent h-10 w-10" /></div>}</div>
        <div className="p-3 sm:p-4"><h2 className="line-clamp-2 text-sm font-bold sm:text-base">{product.title}</h2><p className="text-muted mt-1 hidden line-clamp-2 text-sm sm:block">{product.description || 'Official Neurodiversity Nation merch.'}</p><div className="mt-3 flex flex-col items-stretch gap-2 sm:mt-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3"><span className="text-sm font-semibold sm:text-base">{new Intl.NumberFormat(undefined, { currency: product.currencyCode, style: 'currency' }).format(Number(product.price))}</span><button type="button" onClick={() => addToCart(product)} className="bg-accent text-accent-foreground min-h-10 w-full rounded-full px-3 py-2 text-xs font-semibold sm:w-auto sm:px-4 sm:text-sm">Add to cart</button></div></div>
      </article>)}
    </div>
  </>;
}
