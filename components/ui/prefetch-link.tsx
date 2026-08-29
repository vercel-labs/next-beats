'use client';

import { usePrefetchDefault } from '@/components/demo/use-prefetch-default';
import { FastLink } from '@/components/ui/fast-link';
import { preloadImages } from '@/lib/preload-images';
import type { PreloadImageSource } from '@/lib/preload-images';
import type { Route } from 'next';
import type Link from 'next/link';

type Props<T extends string = string> = Omit<React.ComponentProps<typeof Link>, 'href' | 'prefetch'> & {
  href: Route<T> | URL;
  preloadImageSources?: readonly PreloadImageSource[];
};

export function PrefetchLink<T extends string>({ href, preloadImageSources, ...props }: Props<T>) {
  const prefetch = usePrefetchDefault();
  if (prefetch) preloadImages(preloadImageSources);
  return <FastLink {...props} href={href as Route} prefetch={prefetch} />;
}
