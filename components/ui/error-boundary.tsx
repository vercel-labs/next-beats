'use client';

import { catchError } from 'next/error';
import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/error-state';
import { Spinner } from '@/components/ui/spinner';
import type { ErrorInfo } from 'next/error';

type Props = { title?: string; body?: string; compact?: boolean };

function ErrorFallback({ body, compact, title }: Props, { retry }: ErrorInfo) {
  const [isPending, startTransition] = useTransition();

  return (
    <ErrorState body={body} compact={compact} title={title}>
      <Button
        onClick={() => startTransition(() => retry())}
        disabled={isPending}
        aria-busy={isPending}
        size="sm"
        variant="secondary"
      >
        {isPending && <Spinner />}
        {isPending ? 'Retrying…' : 'Try again'}
      </Button>
    </ErrorState>
  );
}

export default catchError(ErrorFallback);
