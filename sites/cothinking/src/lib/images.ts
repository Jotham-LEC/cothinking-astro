// The images the Laravel views sent through Glide (work tiles, a case study's
// screenshot, a testimonial's photo), resized and cropped by astro:assets.
// They stay in public/media with the rest; the glob hands their files to
// getImage, which cannot read public/ by path. A file is only built when a
// page asks for it.
import { getImage } from 'astro:assets';

const files = import.meta.glob<{ default: ImageMetadata }>('/public/media/**/*.{webp,jpg,jpeg,png}');

type Options = { width: number; height?: number; crop?: 'center' | 'top'; quality: number };

/** `src` is the address (/media/…); a crop fills width × height from the centre or the top, else the width is a maximum. */
export async function mediaImage(src: string, { width, height, crop, quality }: Options) {
  const load = files[`/public${src}`];
  if (!load) throw new Error(`${src} is not in public/media.`);
  const image = (await load()).default;
  return getImage({
    src: image,
    width: Math.min(width, image.width),
    ...(crop && height ? { height, fit: 'cover' as const, position: crop } : {}),
    quality,
  });
}
