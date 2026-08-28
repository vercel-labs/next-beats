import { getImageProps } from 'next/image';
import { preload } from 'react-dom';

export type PreloadImageSource = {
  sizes: string;
  src: string;
};

export function preloadImages(sources: readonly PreloadImageSource[] | undefined) {
  sources?.forEach(source => {
    const { props } = getImageProps({ alt: '', fill: true, sizes: source.sizes, src: source.src });
    preload(props.src, {
      as: 'image',
      fetchPriority: 'low',
      imageSizes: props.sizes,
      imageSrcSet: props.srcSet,
    });
  });
}
