'use client';

import { catchError } from 'next/error';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/error-state';
import type { ErrorInfo } from 'next/error';

type Props = { title?: string; body?: string; compact?: boolean };

function ErrorFallback({ body, compact, title }: Props, { retry }: ErrorInfo) {
  return (
    <ErrorState body={body} compact={compact} title={title}>
      <Button onClick={() => retry()} size="sm" variant="secondary">
        Try again
      </Button>
    </ErrorState>
  );
}

export default catchError(ErrorFallback);
