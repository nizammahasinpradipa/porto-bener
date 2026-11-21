import type { Metadata, Viewport } from 'next';
import { Instrument_Serif, Instrument_Sans } from 'next/font/google';
import './globals.css';

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-instrument-serif',
  display: 'swap',
});

const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-instrument-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'MyPorto — Dippa · UI/UX, Design & Frontend',
  description:
    'Personal portfolio of Dippa (MyPorto): UI/UX design, print posters, and interactive frontend engineering in black monochrome.',
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: 'MyPorto — Dippa · UI/UX, Design & Frontend',
    description:
      'Personal portfolio of Dippa (MyPorto): UI/UX design, print posters, and interactive frontend engineering.',
    type: 'website',
    images: ['/share.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MyPorto — Dippa · UI/UX, Design & Frontend',
    description:
      'Personal portfolio of Dippa (MyPorto): UI/UX design, print posters, and interactive frontend engineering.',
    images: ['/share.jpg'],
  },
};

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${instrumentSerif.variable} ${instrumentSans.variable}`}
    >
      <body className="bg-subtle-grid selection:bg-white selection:text-black">
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
