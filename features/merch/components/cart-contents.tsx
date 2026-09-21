'use client';

import { useEffect, useState } from 'react';

export function CartContents() {
  const [cart, setCart] = useState<{ checkoutUrl: string | null; totalQuantity: number; cost?: { subtotalAmount: { amount: string; currencyCode: string } } } | null>(null);
  useEffect(() => { fetch('/api/shopify/cart').then(response => response.json()).then(payload => setCart(payload.cart ?? null)).catch(() => setCart(null)); }, []);
  if (!cart) return <p className="text-muted">Your bag is empty.</p>;
  return <><p className="text-muted">{cart.totalQuantity} item{cart.totalQuantity === 1 ? '' : 's'} · {cart.cost?.subtotalAmount.currencyCode} {cart.cost?.subtotalAmount.amount}</p>{cart.checkoutUrl && <a href={cart.checkoutUrl} className="bg-accent text-accent-foreground mt-5 inline-flex rounded-full px-5 py-2.5 text-sm font-semibold">Checkout securely</a>}</>;
}
