type PodcastStructuredDataProps = {
  title: string;
  description: string;
  image?: string;
  url: string;
  episodeCount?: number;
};

export function PodcastStructuredData({ title, description, image, url, episodeCount }: PodcastStructuredDataProps) {
  const graph = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Neurodiversity Nation: Amplifying Voices',
      url: 'https://neurodiversitynation.com',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'PodcastSeries',
      author: { '@type': 'Organization', name: 'Neurodiversity Nation' },
      description,
      image,
      name: title,
      numberOfEpisodes: episodeCount,
      publisher: { '@type': 'Organization', name: 'Neurodiversity Nation' },
      url,
      webFeed: 'https://www.spreaker.com/show/neurodiversity-nation-amplifying-voices',
    },
  ];
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }) }} />;
}
