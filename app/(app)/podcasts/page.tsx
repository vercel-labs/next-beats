import { ExternalLink } from 'lucide-react';
import { PageWrapper } from '@/components/ui/page-layout';
import { AccessibilityControls } from '@/features/accessibility/components/accessibility-controls';
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
      <section className="mt-10" aria-labelledby="explore-podcast">
        <div className="mb-4"><p className="text-accent text-xs font-bold uppercase tracking-[0.18em]">Explore the show</p><h2 id="explore-podcast" className="mt-1 text-2xl font-bold">Find your way in</h2></div>
        <div className="flex flex-wrap gap-2" aria-label="Podcast topics">
          {['Lived experience', 'Caregiving', 'Education', 'Advocacy', 'Intersectional health', 'Interviews'].map(topic => <span key={topic} className="rounded-full bg-accent/10 px-3 py-2 text-sm font-semibold text-accent">{topic}</span>)}
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {[
            ['Spotify', 'https://open.spotify.com'],
            ['JioSaavn', 'https://www.jiosaavn.com'],
            ['Amazon Music', 'https://music.amazon.com'],
            ['Spreaker', 'https://www.spreaker.com/podcast/neurodiversity-nation-amplifying-voices--5972496'],
          ].map(([label, href]) => <a key={label} href={href} target="_blank" rel="noreferrer" className="border-divider dark:border-divider-dark text-muted hover:border-accent hover:text-accent inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold">{label}<ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /></a>)}
        </div>
      </section>
      <section className="mt-6" aria-labelledby="about-podcast">
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
        <div id="highlighted-conversations" className="bg-card dark:bg-card-dark rounded-2xl p-5 sm:p-6">
          <p className="text-accent text-xs font-bold uppercase tracking-[0.18em]">Highlighted conversations</p>
          <ul className="text-muted mt-3 grid gap-3 text-sm leading-6 sm:grid-cols-3">
            <li><strong className="text-foreground">Parental empowerment:</strong> a conversation with Temple Grandin and Dr. Geeta Shroff about proactive family engagement.</li>
            <li><strong className="text-foreground">Overcoming academic stigma:</strong> Nicholas Ndungu, Mr. Autism Kenya, on advocacy, farming, and being misread by the school system.</li>
            <li><strong className="text-foreground">Special-needs education:</strong> specialist teachers on vocabulary, patience, and building a child&apos;s self-esteem.</li>
          </ul>
        </div>
      </section>
      <section className="mt-10" aria-labelledby="take-action">
        <div className="mb-4"><p className="text-accent text-xs font-bold uppercase tracking-[0.18em]">Beyond listening</p><h2 id="take-action" className="mt-1 text-2xl font-bold">Turn insight into action.</h2><p className="text-muted mt-2 max-w-2xl text-sm leading-6">Keep the conversation moving with practical starting points for families, educators, and advocates.</p></div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ['For families', 'Prepare questions, document support needs, and build a care team around the person at the center.', 'Start with a conversation', '#about-podcast'],
            ['For educators', 'Explore individualized support, inclusive language, and classroom practices that build confidence.', 'Explore inclusive learning', '#highlighted-conversations'],
            ['For advocates', 'Share lived experience, challenge stigma, and help make education and healthcare more empathetic.', 'Join the movement', 'https://www.spreaker.com/podcast/neurodiversity-nation-amplifying-voices--5972496'],
          ].map(([title, description, action, href]) => <article key={title} className="bg-card dark:bg-card-dark rounded-2xl p-5"><div className="mb-4 h-1 w-10 rounded-full bg-accent" /><h3 className="font-semibold">{title}</h3><p className="text-muted mt-2 text-sm leading-6">{description}</p><a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noreferrer' : undefined} className="text-accent mt-4 inline-flex text-sm font-bold hover:underline">{action} <span aria-hidden="true">→</span></a></article>)}
        </div>
      </section>
      <div className="mt-6"><AccessibilityControls /></div>
    </PageWrapper>
  );
}
