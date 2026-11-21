'use client';

import { useCallback, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { HeroSection } from '@/components/HeroSection';
import { ProjectsSection } from '@/components/ProjectsSection';
import { ContactSection } from '@/components/ContactSection';
import { Footer } from '@/components/Footer';
import { ScrollMotionBlur } from '@/components/ScrollMotionBlur';
import { PageLoader } from '@/components/PageLoader';
import { PlasmaBackground } from '@/components/PlasmaBackground';

export function PortfolioShell() {
  const [isRevealed, setIsRevealed] = useState(false);

  const handleReveal = useCallback(() => {
    setIsRevealed(true);
  }, []);

  return (
    <>
      <PlasmaBackground />
      <PageLoader onReveal={handleReveal} />
      <ScrollMotionBlur targetId="main-content" />
      <Navbar />
      <main id="main-content" className="relative z-10">
        <HeroSection isRevealed={isRevealed} />
        <ProjectsSection />
        <ContactSection />
      </main>
      <div className="relative z-10">
        <Footer />
      </div>
    </>
  );
}
