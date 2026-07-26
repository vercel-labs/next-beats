'use client';

import { Search as SearchIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useId, useRef, useTransition } from 'react';
import { Boundary } from '@/components/demo/boundary';
import { SeedFromSearchParam } from '@/components/scripts/seed-from-search-param';
import { useSyncInputToSearchParam } from '@/hooks/use-sync-input-to-search-param';
import type { Route } from 'next';

export function Search({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const [isPending, startTransition] = useTransition();

  useSyncInputToSearchParam(inputRef, 'q');

  return (
    <Boundary label="Search">
      <div className="relative mb-8 flex items-center">
        <SearchIcon className="text-gray pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2" />
        <input
          ref={inputRef}
          id={inputId}
          type="search"
          name="q"
          autoComplete="off"
          aria-label="Search tracks"
          placeholder="What do you want to listen to?"
          suppressHydrationWarning
          onChange={event => {
            const value = event.target.value;
            startTransition(() => {
              router.replace((value ? `/search?q=${encodeURIComponent(value)}` : '/search') as Route, {
                scroll: false,
              });
            });
          }}
          className="!rounded-full !py-3 !pr-4 !pl-12 !text-base"
        />
        <SeedFromSearchParam targetId={inputId} param="q" />
      </div>
      <div
        className="transition-opacity duration-200 ease-out data-pending:opacity-60"
        data-pending={isPending ? '' : undefined}
      >
        {children}
      </div>
    </Boundary>
  );
}
