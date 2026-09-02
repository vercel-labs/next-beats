import { Suspense, ViewTransition } from 'react';
import type { ReactNode } from 'react';

export function AnimatedSuspense({ fallback, children }: { fallback: ReactNode; children: ReactNode }) {
  return (
    <ViewTransition enter="auto" exit="auto" default="none">
      <Suspense fallback={fallback}>
        <ViewTransition default="none">{children}</ViewTransition>
      </Suspense>
    </ViewTransition>
  );
}
