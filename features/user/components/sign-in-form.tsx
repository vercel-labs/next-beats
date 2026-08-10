'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { signIn } from '@/features/user/user-actions';

type State = { error?: string } | null;

async function action(_prev: State, formData: FormData): Promise<State> {
  const result = await signIn(formData);
  if (result && !result.ok) return { error: result.error };
  return null;
}

export function SignInForm() {
  const [state, formAction] = useActionState(action, null);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label htmlFor="email" className="text-muted text-sm">
        Demo email
      </label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        required
        autoFocus
        defaultValue="demo@example.com"
        placeholder="you@example.com"
        aria-invalid={state?.error ? true : undefined}
        aria-describedby={state?.error ? 'sign-in-hint sign-in-error' : 'sign-in-hint'}
      />
      <p id="sign-in-hint" className="text-muted -mt-1 text-xs">
        Any fake email works.
      </p>
      {state?.error ? (
        <p id="sign-in-error" role="alert" className="text-sm text-red-500">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" className="w-full">
        Sign in
      </Button>
    </form>
  );
}
