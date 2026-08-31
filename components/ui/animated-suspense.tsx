import { Suspense, ViewTransition } from 'react';

export function AnimatedSuspense({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <ViewTransition default="none" exit="auto">
          {fallback}
        </ViewTransition>
      }
    >
      <ViewTransition enter="auto" default="none">
        {children}
      </ViewTransition>
    </Suspense>
  );
}
