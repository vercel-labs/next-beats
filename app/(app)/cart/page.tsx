import Link from 'next/link';
import { PageWrapper } from '@/components/ui/page-layout';
import { CartContents } from '@/features/merch/components/cart-contents';

export default function CartPage() {
  return (
    <PageWrapper>
      <div className="mx-auto max-w-3xl py-8 sm:py-12">
        <div className="mb-8">
          <p className="text-accent text-sm font-semibold uppercase tracking-[0.18em]">Shopping bag</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Your bag</h1>
          <p className="text-muted mt-2">Review your NextBeats merch before checkout.</p>
        </div>
        <div className="bg-card dark:bg-card-dark rounded-2xl p-8 text-center">
          <CartContents />
          <Link href="/merch" className="bg-accent text-accent-foreground mt-5 inline-flex rounded-full px-5 py-2.5 text-sm font-semibold">Browse merch</Link>
        </div>
      </div>
    </PageWrapper>
  );
}
