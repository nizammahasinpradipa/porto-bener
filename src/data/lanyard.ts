export interface LanyardPhoto {
  src: string;
  label?: string;
}

/**
 * Permanent lanyard photos for your deployed portfolio.
 *
 * How to add your own photos permanently:
 * 1. Copy your image file(s) into `public/lanyard/` (for example `public/lanyard/me-1.jpg`).
 * 2. Add them to the array below, e.g.:
 *    { src: '/lanyard/me-1.jpg', label: '01' },
 *    { src: '/lanyard/me-2.jpg', label: '02' },
 *
 * Visitors (and you while previewing locally) can also load photos directly
 * using the subtle photo button beneath the lanyard.
 */
export const LANYARD_PHOTOS: LanyardPhoto[] = [];
