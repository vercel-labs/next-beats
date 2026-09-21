import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { shopifyRequest } from '@/lib/shopify/storefront';

const inputSchema = z.object({
  merchandiseId: z.string().min(1),
  quantity: z.number().int().min(1).max(100).default(1),
});

const cartQuery = `#graphql
  query Cart($id: ID!) {
    cart(id: $id) {
      id
      checkoutUrl
      totalQuantity
      cost { subtotalAmount { amount currencyCode } }
      lines(first: 50) { nodes { id quantity merchandise { ... on ProductVariant { id title image { url altText } price { amount currencyCode } product { title } } } } }
    }
  }
`;

const cartLinesAddMutation = `#graphql
  mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) { cart { id checkoutUrl totalQuantity } userErrors { message field code } }
  }
`;

const cartCreateMutation = `#graphql
  mutation CartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        id
        checkoutUrl
        totalQuantity
        cost {
          subtotalAmount { amount currencyCode }
        }
      }
      userErrors { message field code }
    }
  }
`;

export async function GET() {
  const cartId = (await cookies()).get('nextbeats_cart')?.value;
  if (!cartId) return NextResponse.json({ cart: null });
  try {
    const data = await shopifyRequest<{ cart: unknown }>(cartQuery, { id: decodeURIComponent(cartId) });
    return NextResponse.json({ cart: data.cart });
  } catch {
    return NextResponse.json({ cart: null });
  }
}

export async function POST(request: Request) {
  try {
    const parsed = inputSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { code: 'INVALID_INPUT', error: 'Invalid request: merchandiseId and quantity required.' },
        { status: 400 }
      );
    }

    const existingCartId = (await cookies()).get('nextbeats_cart')?.value;
    if (existingCartId) {
      const data = await shopifyRequest<{ cartLinesAdd: { cart: { id: string; checkoutUrl: string | null; totalQuantity: number } | null; userErrors: Array<{ message: string }> } }>(cartLinesAddMutation, { cartId: decodeURIComponent(existingCartId), lines: [{ merchandiseId: parsed.data.merchandiseId, quantity: parsed.data.quantity }] });
      if (data.cartLinesAdd.userErrors.length || !data.cartLinesAdd.cart) return NextResponse.json({ error: data.cartLinesAdd.userErrors[0]?.message ?? 'Unable to update cart.' }, { status: 400 });
      return NextResponse.json({ cart: data.cartLinesAdd.cart, checkoutUrl: data.cartLinesAdd.cart.checkoutUrl });
    }

    const data = await shopifyRequest<{
      cartCreate: {
        cart: { id: string; checkoutUrl: string | null; totalQuantity: number; cost?: { subtotalAmount: { amount: string; currencyCode: string } } } | null;
        userErrors: Array<{ message: string; field?: string; code?: string }>;
      };
    }>(cartCreateMutation, {
      input: {
        lines: [
          {
            merchandiseId: parsed.data.merchandiseId,
            quantity: parsed.data.quantity,
          },
        ],
      },
    });

    if (data.cartCreate.userErrors.length) {
      const err = data.cartCreate.userErrors[0];
      return NextResponse.json(
        { code: err?.code ?? 'CART_ERROR', error: err?.message ?? 'Unable to create cart.' },
        { status: 400 }
      );
    }

    if (!data.cartCreate.cart) return NextResponse.json({ code: 'NO_CART', error: 'Unable to create cart.' }, { status: 400 });
    (await cookies()).set('nextbeats_cart', encodeURIComponent(data.cartCreate.cart.id), { httpOnly: true, maxAge: 60 * 60 * 24 * 30, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });

    return NextResponse.json({
      cart: data.cartCreate.cart,
      checkoutUrl: data.cartCreate.cart.checkoutUrl,
    });
  } catch (error) {
    return NextResponse.json(
      { code: 'SHOPIFY_ERROR', error: error instanceof Error ? error.message : 'Shopify is unavailable.' },
      { status: 502 }
    );
  }
}
