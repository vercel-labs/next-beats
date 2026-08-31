'use client';

import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/error-state';

export default function GenreError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorState title="Couldn't load tracks for this genre">
      <Button onClick={reset} size="sm" variant="secondary">
        Try again
      </Button>
    </ErrorState>
  );
}
