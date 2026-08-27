'use client';

import Link from 'next/link';
import { usePrefetchDefault } from '@/components/demo/use-prefetch-default';
import { preloadImages } from '@/lib/preload-images';
import type { Route } from 'next';

type Props<T extends string = string> = Omit<React.ComponentProps<typeof Link>, 'href' | 'prefetch'> & {
  href: Route<T> | URL;
  preloadImageSources?: readonly string[];
};

export function PrefetchLink<T extends string>({ href, preloadImageSources, ...props }: Props<T>) {
  const prefetch = usePrefetchDefault();
  if (prefetch) preloadImages(preloadImageSources);
  return <Link {...props} href={href as Route} prefetch={prefetch} />;
}
