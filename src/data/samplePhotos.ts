import { SamplePhoto } from '../types';

export const SAMPLE_PHOTOS: SamplePhoto[] = [
  {
    id: 'vintage-portrait',
    title: '1940s Vintage Portrait',
    era: '1940s Studio Portrait',
    description: 'Soft focus studio portrait with age patina, faint silvering, and gentle motion blur.',
    url: '/src/assets/images/old_blurry_portrait_1792137806701.jpg',
    initialPresetId: 'face-portrait-hd',
  },
  {
    id: 'scratched-antique',
    title: '1920s Scratched Lady',
    era: '1920s Antique Silver Gelatin',
    description: 'Fine surface scratches, paper creases, edge fading, and delicate lace details needing unblur.',
    url: '/src/assets/images/scratched_monochrome_1792137806497.jpg',
    initialPresetId: 'scratch-dust-eraser',
  },
  {
    id: 'faded-family',
    title: '1970s Faded Family',
    era: '1970s Vintage Kodacolor',
    description: 'Yellowed aged paper, lost shadow dynamics, soft facial defocus, and faded vintage color cast.',
    url: '/src/assets/images/faded_family_vintage_1792137807653.jpg',
    initialPresetId: 'vintage-color-rebirth',
  },
];
