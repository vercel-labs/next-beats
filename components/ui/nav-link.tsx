'use client';

import Link from 'next/link';
import { useSelectedLayoutSegments } from 'next/navigation';
import { Suspense } from 'react';
import type { Route } from 'next';

type Props<T extends string = string> = Omit<React.ComponentProps<typeof Link>, 'href'> & {
  href: Route<T> | URL;
};

// `useSelectedLayoutSegments` is dynamic under `cacheComponents`, so the
// active-state computation has to live behind a Suspense boundary. Fallback
// and resolved tree both render through `NavLinkShell` so React reconciles
// the same <a> element in place — no DOM swap, no flash.
export function NavLink<T extends string>(props: Props<T>) {
  return (
    <Suspense fallback={<NavLinkShell {...props} isActive={false} />}>
      <ActiveLink {...props} />
    </Suspense>
  );
}

function ActiveLink<T extends string>(props: Props<T>) {
  const segments = useSelectedLayoutSegments();
  const want = props.href.toString().split('?')[0].split('#')[0].split('/').filter(Boolean);
  const isActive = want.length === segments.length && want.every((s, i) => s === segments[i]);
  return <NavLinkShell {...props} isActive={isActive} />;
}

function NavLinkShell<T extends string>({ href, isActive, ...rest }: Props<T> & { isActive: boolean }) {
  return (
    <Link
      {...rest}
      href={href as Route}
      data-nav-link
      aria-current={isActive ? 'page' : undefined}
      suppressHydrationWarning
    />
  );
}
