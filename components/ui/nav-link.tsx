'use client';

import { useSelectedLayoutSegments } from 'next/navigation';
import { createContext, Suspense, useContext, useOptimistic, useState } from 'react';
import { Boundary } from '@/components/demo/boundary';
import { usePrefetchDefault } from '@/components/demo/use-prefetch-default';
import { FastLink } from '@/components/ui/fast-link';
import { preloadImages } from '@/lib/preload-images';
import type { PreloadImageSource } from '@/lib/preload-images';
import type { Route } from 'next';
import type Link from 'next/link';

type Props<T extends string = string> = Omit<React.ComponentProps<typeof Link>, 'href' | 'prefetch'> & {
  href: Route<T> | URL;
  // Defer this link's URL-specific prefetch until the user hovers/focuses it, rather
  // than firing it eagerly when the link enters the viewport. Use for unbounded
  // lists (e.g. the playlist sidebar) so N links don't each wake a server on load.
  hoverPrefetch?: boolean;
  preloadImageSources?: readonly PreloadImageSource[];
};

type OptimisticNavigation = {
  destination: string | null;
  navigate: (destination: string) => void;
};

const OptimisticNavigationContext = createContext<OptimisticNavigation | null>(null);

export function OptimisticNavigationProvider({ children }: { children: React.ReactNode }) {
  const [destination, navigate] = useOptimistic<string | null>(null);

  return <OptimisticNavigationContext value={{ destination, navigate }}>{children}</OptimisticNavigationContext>;
}

// `useSelectedLayoutSegments` is dynamic under `cacheComponents`, so the
// active-state computation has to live behind a Suspense boundary. The
// fallback renders the same DOM shape with `isActive=false` so React
// reconciles the resolved tree in place — no element swap, no flash.
export function NavLink<T extends string>(props: Props<T>) {
  return (
    <Boundary label="NavLink">
      <Suspense fallback={<NavLinkShell {...props} isActive={false} />}>
        <ActiveLink {...props} />
      </Suspense>
    </Boundary>
  );
}

function ActiveLink<T extends string>(props: Props<T>) {
  const segments = useSelectedLayoutSegments();
  const want = pathname(props.href).split('/').filter(Boolean);
  const isActive = want.length === segments.length && want.every((s, i) => s === segments[i]);
  return <NavLinkShell {...props} isActive={isActive} />;
}

function NavLinkShell<T extends string>({
  href,
  isActive,
  hoverPrefetch = false,
  preloadImageSources,
  onMouseEnter,
  onFocus,
  ...rest
}: Props<T> & { isActive: boolean }) {
  const [intent, setIntent] = useState(false);
  const optimisticNavigation = useContext(OptimisticNavigationContext);
  const prefetch = usePrefetchDefault();
  // `prefetch` is already `true` or `null` (App Shell only) from the demo toggle.
  // Hover-gated links stay at `null` until intent, then upgrade to the full prefetch.
  const resolvedPrefetch = !prefetch ? null : hoverPrefetch ? (intent ? true : null) : true;
  if (resolvedPrefetch) preloadImages(preloadImageSources);
  const showIntent = () => setIntent(true);
  const destination = pathname(href);
  const resolvedActive = optimisticNavigation?.destination
    ? optimisticNavigation.destination === destination
    : isActive;
  return (
    <FastLink
      prefetch={resolvedPrefetch}
      {...rest}
      href={href as Route}
      onPressNavigate={() => optimisticNavigation?.navigate(destination)}
      onMouseEnter={e => {
        if (hoverPrefetch) showIntent();
        onMouseEnter?.(e);
      }}
      onFocus={e => {
        if (hoverPrefetch) showIntent();
        onFocus?.(e);
      }}
      data-nav-link
      aria-current={resolvedActive ? 'page' : undefined}
      suppressHydrationWarning
    />
  );
}

function pathname(href: string | URL) {
  return href.toString().split('?')[0].split('#')[0];
}
