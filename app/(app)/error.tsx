'use client';

import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/error-state';

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorState body="We couldn't load this page. Please try again." title="Something went wrong">
      <Button onClick={reset} size="sm" variant="secondary">
        Try again
      </Button>
    </ErrorState>
  );
}
