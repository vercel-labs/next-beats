import { PageWrapper } from '@/components/ui/page-layout';
import { PodcastShowDetail } from '@/features/podcast/components/podcast-detail';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  description: 'Your Neurodiversity Nation podcast library and episode discovery space.',
  title: 'Podcast library',
};

export default function LibraryPage() {
  return (
    <PageWrapper title="Podcast library">
      <section className="relative mb-8 overflow-hidden rounded-3xl bg-[#171717] p-6 text-white sm:p-8">
        <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-accent/25 blur-3xl" aria-hidden="true" />
        <div className="relative max-w-2xl"><p className="text-accent text-xs font-bold uppercase tracking-[0.18em]">Your podcast library</p><h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Keep the conversations close.</h1><p className="mt-3 text-sm leading-6 text-white/65">Browse real Neurodiversity Nation episodes from Spreaker. Music remains available separately as a secondary experience.</p></div>
      </section>
      <PodcastShowDetail id="5972496" />
    </PageWrapper>
  );
}
