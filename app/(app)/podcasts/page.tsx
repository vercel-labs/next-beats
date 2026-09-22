import { PageWrapper } from '@/components/ui/page-layout';
import { PodcastShowDetail } from '@/features/podcast/components/podcast-detail';
import type { Metadata } from 'next';

const FEATURED_SHOW_ID = '5972496';

export const metadata: Metadata = {
  description: 'Listen to Neurodiversity Nation: Amplifying Voices, a Kenyan storytelling and advocacy podcast hosted by Dr. Sylvia Mochabo Akinsiku.',
  title: 'Neurodiversity Nation: Amplifying Voices',
};

export default function PodcastsPage() {
  return (
    <PageWrapper>
      <PodcastShowDetail id={FEATURED_SHOW_ID} />
      <section className="mt-10 space-y-6" aria-labelledby="about-podcast">
        <div>
          <p className="text-accent text-xs font-bold uppercase tracking-[0.18em]">The mission</p>
          <h2 id="about-podcast" className="mt-1 text-2xl font-bold tracking-tight">Stories that make room for every voice.</h2>
          <p className="text-muted mt-3 max-w-3xl text-sm leading-6">Neurodiversity Nation: Amplifying Voices is an intentional storytelling and advocacy platform hosted by Dr. Sylvia Mochabo Akinsiku. The show works to dismantle stigma around neurological differences, especially within Kenyan education and healthcare systems, through deep and intersectional conversations.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            ['Firsthand journeys', 'Autistic and dyslexic guests share career paths, systemic hurdles, and strategies for navigating a primarily neurotypical society.'],
            ['Caregiving realities', 'Parents and guardians discuss practical care, psychological wellbeing, empowerment, and self-care.'],
            ['Education and advocacy', 'Conversations explore IEPs, shadow teachers, inclusive language, and structural legal change for vulnerable people.'],
            ['Intersectional health', 'Panels connect neurodiversity with overlapping health experiences, including epilepsy and everyday mental health.'],
          ].map(([title, description]) => <article key={title} className="bg-card dark:bg-card-dark rounded-2xl p-5"><h3 className="font-semibold">{title}</h3><p className="text-muted mt-2 text-sm leading-6">{description}</p></article>)}
        </div>
        <div className="bg-card dark:bg-card-dark rounded-2xl p-5 sm:p-6">
          <p className="text-accent text-xs font-bold uppercase tracking-[0.18em]">Highlighted conversations</p>
          <ul className="text-muted mt-3 grid gap-3 text-sm leading-6 sm:grid-cols-3">
            <li><strong className="text-foreground">Parental empowerment:</strong> a conversation with Temple Grandin and Dr. Geeta Shroff about proactive family engagement.</li>
            <li><strong className="text-foreground">Overcoming academic stigma:</strong> Nicholas Ndungu, Mr. Autism Kenya, on advocacy, farming, and being misread by the school system.</li>
            <li><strong className="text-foreground">Special-needs education:</strong> specialist teachers on vocabulary, patience, and building a child&apos;s self-esteem.</li>
          </ul>
        </div>
      </section>
    </PageWrapper>
  );
}
