'use client';

import React, { Component, useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useReducedMotion } from 'framer-motion';
import { Navbar } from '@/components/Navbar';
import { HeroSection } from '@/components/HeroSection';
import { ProjectsSection } from '@/components/ProjectsSection';
import { ContactSection } from '@/components/ContactSection';
import { Footer } from '@/components/Footer';
import { ScrollMotionBlur } from '@/components/ScrollMotionBlur';
import { PageLoader } from '@/components/PageLoader';
import { PlasmaBackground } from '@/components/PlasmaBackground';

const Lanyard3D = dynamic(() => import('@/components/Lanyard3D'), {
  ssr: false,
  loading: () => null,
});

class LanyardErrorBoundary extends Component<
  { onError: () => void; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { onError: () => void; children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

export function PortfolioShell() {
  const prefersReducedMotion = useReducedMotion();
  const shellRef = useRef<HTMLDivElement>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [canUseWebGL, setCanUseWebGL] = useState<boolean | null>(null);

  useEffect(() => {
    if (prefersReducedMotion) {
      setCanUseWebGL(false);
      return;
    }
    try {
      const canvas = document.createElement('canvas');
      const gl =
        canvas.getContext('webgl2') ||
        canvas.getContext('webgl') ||
        canvas.getContext('experimental-webgl');
      setCanUseWebGL(Boolean(gl));
    } catch {
      setCanUseWebGL(false);
    }
  }, [prefersReducedMotion]);

  const handleReveal = useCallback(() => {
    setIsRevealed(true);
  }, []);

  const handleWebGLError = useCallback(() => {
    setCanUseWebGL(false);
  }, []);

  return (
    <div ref={shellRef} className="relative min-h-[100svh]">
      <PlasmaBackground />
      <PageLoader onReveal={handleReveal} />
      <ScrollMotionBlur targetId="main-content" />

      {/* Full-viewport 3D Lanyard overlay above all sections so dragging down, left, or right
          is never clipped or blocked by the Projects section or any other container. */}
      {canUseWebGL === true && (
        <div className="fixed inset-0 z-40 pointer-events-none">
          <LanyardErrorBoundary onError={handleWebGLError}>
            <Lanyard3D eventSource={shellRef} active={isRevealed} />
          </LanyardErrorBoundary>
        </div>
      )}

      <Navbar />
      <main id="main-content" className="relative z-10">
        <HeroSection isRevealed={isRevealed} showStaticFallback={canUseWebGL === false} />
        <ProjectsSection />
        <ContactSection />
      </main>
      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}
