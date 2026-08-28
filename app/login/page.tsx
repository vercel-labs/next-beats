import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { MusicNote } from '@/components/ui/music-note';
import { LoginMusicPreview } from '@/features/user/components/login-music-preview';
import { SignInForm } from '@/features/user/components/sign-in-form';
import { getCurrentUser } from '@/features/user/user-queries';

export default function LoginPage() {
  return (
    <main className="bg-surface dark:bg-surface-dark relative isolate grid min-h-dvh place-items-center overflow-hidden pt-[max(1rem,env(safe-area-inset-top))] pr-[max(1rem,env(safe-area-inset-right))] pb-[max(1rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] sm:pt-[max(1.5rem,env(safe-area-inset-top))] sm:pr-[max(1.5rem,env(safe-area-inset-right))] sm:pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:pl-[max(1.5rem,env(safe-area-inset-left))]">
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
  if (await getCurrentUser()) redirect('/');
  return null;
}
