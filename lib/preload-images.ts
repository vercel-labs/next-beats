import { preload } from 'react-dom';

export function preloadImages(sources: readonly string[] | undefined) {
  sources?.forEach(src => preload(src, { as: 'image', fetchPriority: 'low' }));
}
