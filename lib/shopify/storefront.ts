import 'server-only';

const domain = process.env.SHOPIFY_STORE_DOMAIN;
const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;

const storefrontEndpoint = domain ? `https://${domain}/api/2026-07/graphql.json` : null;

export type ShopifyProduct = {
  id: string;
  title: string;
  handle: string;
  description: string;
  featuredImage: { url: string; altText: string | null } | null;
  price: string;
  currencyCode: string;
  variantId: string;
};

const productsQuery = `#graphql
  query MerchProducts($first: Int!) {
    products(first: $first, sortKey: BEST_SELLING) {
      nodes {
        id
        title
        handle
        description
        featuredImage { url altText }
        priceRange { minVariantPrice { amount currencyCode } }
        variants(first: 1) { nodes { id } }
      }
    }
  }
`;

export async function getMerchProducts(): Promise<ShopifyProduct[]> {
  if (!storefrontEndpoint || !token) return [];
  const response = await fetch(storefrontEndpoint, {
    body: JSON.stringify({ query: productsQuery, variables: { first: 24 } }),
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': token },
    method: 'POST',
    next: { revalidate: 300, tags: ['shopify-products'] },
  });
  if (!response.ok) throw new Error('Shopify catalog is unavailable.');
  const payload = await response.json() as { data?: { products?: { nodes?: Array<Record<string, unknown>> } }; errors?: unknown[] };
  if (payload.errors?.length) throw new Error('Shopify catalog returned an error.');
  return (payload.data?.products?.nodes ?? []).flatMap(product => {
    const price = product.priceRange && typeof product.priceRange === 'object' ? product.priceRange as Record<string, unknown> : null;
    const minPrice = price?.minVariantPrice && typeof price.minVariantPrice === 'object' ? price.minVariantPrice as Record<string, unknown> : null;
    const variants = product.variants && typeof product.variants === 'object' ? product.variants as Record<string, unknown> : null;
    const nodes = Array.isArray(variants?.nodes) ? variants.nodes : [];
    const firstVariant = nodes[0] && typeof nodes[0] === 'object' ? nodes[0] as Record<string, unknown> : null;
    if (typeof product.id !== 'string' || typeof product.title !== 'string' || typeof firstVariant?.id !== 'string') return [];
    const image = product.featuredImage && typeof product.featuredImage === 'object' ? product.featuredImage as Record<string, unknown> : null;
    return [{
      currencyCode: typeof minPrice?.currencyCode === 'string' ? minPrice.currencyCode : 'USD',
      description: typeof product.description === 'string' ? product.description : '',
      featuredImage: typeof image?.url === 'string' ? { altText: typeof image.altText === 'string' ? image.altText : null, url: image.url } : null,
      handle: typeof product.handle === 'string' ? product.handle : product.id,
      id: product.id,
      price: typeof minPrice?.amount === 'string' ? minPrice.amount : '0.00',
      title: product.title,
      variantId: firstVariant.id,
    }];
  });
}

export async function shopifyRequest<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  if (!storefrontEndpoint || !token) throw new Error('Shopify is not configured.');
  const response = await fetch(storefrontEndpoint, {
    body: JSON.stringify({ query, variables }),
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': token },
    method: 'POST',
  });
  if (!response.ok) throw new Error('Shopify request failed.');
  const payload = await response.json() as { data?: T; errors?: unknown[] };
  if (payload.errors?.length || !payload.data) throw new Error('Shopify returned an error.');
  return payload.data;
}

export function isShopifyConfigured() {
  return Boolean(storefrontEndpoint && token);
}
