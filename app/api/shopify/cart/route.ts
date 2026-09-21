import { NextResponse } from 'next/server';
import { z } from 'zod';
import { shopifyRequest } from '@/lib/shopify/storefront';

const inputSchema = z.object({ merchandiseId: z.string().min(1), quantity: z.number().int().min(1).max(10).default(1) });
const cartCreateMutation = `#graphql
  mutation CartCreate($input: CartInput!) {
    cartCreate(input: $input) { cart { id checkoutUrl totalQuantity } userErrors { message field } }
  }
`;

export async function POST(request: Request) {
  try {
    const parsed = inputSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Invalid cart item.' }, { status: 400 });
    const data = await shopifyRequest<{ cartCreate: { cart: { id: string; checkoutUrl: string; totalQuantity: number } | null; userErrors: Array<{ message: string }> } }>(cartCreateMutation, { input: { lines: [{ merchandiseId: parsed.data.merchandiseId, quantity: parsed.data.quantity }] } });
    if (data.cartCreate.userErrors.length || !data.cartCreate.cart) return NextResponse.json({ error: data.cartCreate.userErrors[0]?.message ?? 'Unable to create cart.' }, { status: 400 });
    return NextResponse.json(data.cartCreate.cart);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Shopify is unavailable.' }, { status: 502 });
  }
}
