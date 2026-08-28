import { preload } from 'react-dom';

export type PreloadImageSource = {
  src: string;
};

export function preloadImages(sources: readonly PreloadImageSource[] | undefined) {
  sources?.forEach(({ src }) => preload(src, { as: 'image', fetchPriority: 'low' }));
}
