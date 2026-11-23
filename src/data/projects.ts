export type ProjectType = 'Poster' | 'Website';

export interface ProjectItem {
  id: string;
  title: string;
  type: ProjectType;
  year: string;
  image: string;
  aspect: 'portrait' | 'landscape';
  description: string;
  tools: string[];
  linkLabel: string;
  href?: string;
}

export const PROJECTS: ProjectItem[] = [
  {
    id: 'daily-monochrome',
    title: 'The Daily Monochrome',
    type: 'Website',
    year: '2026',
    image: '/projects/website-daily-monochrome.jpg',
    aspect: 'landscape',
    description:
      'Print-inspired monochrome broadsheet news app with live RSS wires, weather report, daily agenda, and a playable mini crossword.',
    tools: ['React', 'Vite', 'RSS Feeds', 'Open-Meteo'],
    linkLabel: 'Visit live site',
    href: 'https://newspaper-smoky.vercel.app/',
  },
  {
    id: 'kinetik-01',
    title: 'Kinetik 01',
    type: 'Poster',
    year: '2026',
    image: '/projects/poster-kinetik.jpg',
    aspect: 'portrait',
    description: 'Exhibition poster built on architectural paper studies and a Swiss typographic grid.',
    tools: ['Figma', 'Illustrator', 'Photoshop'],
    linkLabel: 'View full poster',
  },
  {
    id: 'sonora-archive',
    title: 'Sonora Archive',
    type: 'Poster',
    year: '2026',
    image: '/projects/poster-sonora.jpg',
    aspect: 'portrait',
    description: 'Print poster visualizing concentric acoustic wave patterns for a sound showcase.',
    tools: ['Figma', 'Illustrator'],
    linkLabel: 'View full poster',
  },
  {
    id: 'atelier-mono',
    title: 'Atelier Mono',
    type: 'Website',
    year: '2026',
    image: '/projects/website-atelier.jpg',
    aspect: 'landscape',
    description: 'Monochrome portfolio and archive for an architectural studio, built for fluid motion.',
    tools: ['Next.js', 'TypeScript', 'Tailwind CSS'],
    linkLabel: 'Inspect full interface',
  },
];
