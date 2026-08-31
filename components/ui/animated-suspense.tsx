import { Suspense, ViewTransition } from 'react';

export function AnimatedSuspense({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <ViewTransition default="none" exit="auto">
          {children}
        </ViewTransition>
      }
    >
      <ViewTransition enter="auto" default="none">
        {children}
      </ViewTransition>
    </Suspense>
  );
}
