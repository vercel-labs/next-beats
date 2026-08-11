import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { MusicNote } from '@/components/ui/music-note';
import { LoginMusicPreview } from '@/features/user/components/login-music-preview';
import { SignInForm } from '@/features/user/components/sign-in-form';

const SESSION_COOKIE = 'beats-user';

export default function LoginPage() {
  return (
    <main
      className="bg-surface dark:bg-surface-dark relative isolate grid min-h-dvh place-items-center overflow-hidden p-4 sm:p-6"
      data-login-splash
    >
      <Suspense>
        <RedirectIfAuthed />
      </Suspense>
      <LoginMusicPreview />
      <div className="bg-surface/55 dark:bg-surface-dark/65 absolute inset-0 z-10 backdrop-blur-[4px]" />
      <section className="border-divider bg-surface/95 dark:border-divider-dark dark:bg-surface-dark/95 relative z-20 w-full max-w-sm rounded-2xl border p-6 shadow-2xl backdrop-blur-xl sm:p-8">
        <div className="flex items-center justify-center gap-2 text-2xl font-bold tracking-tight">
          <MusicNote size={28} className="text-accent" />
          <span>NextBeats</span>
        </div>
        <div className="mt-8">
          <SignInForm />
        </div>
      </section>
    </main>
  );
}

async function RedirectIfAuthed() {
  const store = await cookies();
  if (store.has(SESSION_COOKIE)) redirect('/');
  return null;
}
