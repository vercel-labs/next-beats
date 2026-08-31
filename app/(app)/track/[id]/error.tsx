'use client';

import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/error-state';

export default function TrackError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorState title="Couldn't load this track">
      <Button onClick={reset} size="sm" variant="secondary">
        Try again
      </Button>
    </ErrorState>
  );
}
