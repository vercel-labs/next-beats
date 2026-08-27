'use client';

import Link from 'next/link';
import { preload } from 'react-dom';
import { usePrefetchDefault } from '@/components/demo/use-prefetch-default';
import type { Route } from 'next';

type Props<T extends string = string> = Omit<React.ComponentProps<typeof Link>, 'href' | 'prefetch'> & {
  href: Route<T> | URL;
  preloadImages?: readonly string[];
};

export function PrefetchLink<T extends string>({ href, preloadImages, ...props }: Props<T>) {
  const prefetch = usePrefetchDefault();
  if (prefetch) {
    preloadImages?.forEach(src => preload(src, { as: 'image', fetchPriority: 'low' }));
  }
  return <Link {...props} href={href as Route} prefetch={prefetch} />;
}
