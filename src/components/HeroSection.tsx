'use client';

import React, { Component, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowDownRight } from 'lucide-react';
import { StaticBadge } from './StaticBadge';

const Lanyard3D = dynamic(() => import('./Lanyard3D'), {
  ssr: false,
  loading: () => null,
});

const SKILLS = ['UI/UX', 'Design', 'Frontend'] as const;

class WebGLErrorBoundary extends Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { fallback: React.ReactNode; children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

interface HeroSectionProps {
  isRevealed?: boolean;
}

export function HeroSection({ isRevealed = true }: HeroSectionProps) {
  const prefersReducedMotion = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
  const [activeSkill, setActiveSkill] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [canUseWebGL, setCanUseWebGL] = useState<boolean | null>(null);

  // Check WebGL support on mount; show StaticBadge only when reduced motion or no WebGL
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

  // Cycle active mastery skill every 3 seconds
  useEffect(() => {
    if (prefersReducedMotion || isPaused) return;
    const timer = window.setInterval(() => {
      setActiveSkill((prev) => (prev + 1) % SKILLS.length);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [prefersReducedMotion, isPaused]);

  return (
    <section
      ref={heroRef}
      id="home"
      aria-label="Introduction"
      className="relative min-h-[100svh] flex flex-col lg:flex-row lg:items-center pt-16 pb-12 sm:pt-20 lg:py-0 overflow-x-clip"
    >
      {/* Full-width 3D Lanyard layer:
          - Desktop (lg+): covers the ENTIRE hero viewport so dragging far left or far right never clips
          - Mobile/tablet: full viewport width across top above the text */}
      {canUseWebGL === true && (
        <div className="relative w-full h-[460px] sm:h-[540px] lg:absolute lg:inset-0 lg:h-full z-20 pointer-events-none">
          <WebGLErrorBoundary
            fallback={
              <div className="pointer-events-auto flex h-full w-full lg:w-1/2 items-center justify-center">
                <StaticBadge />
              </div>
            }
          >
            <Lanyard3D eventSource={heroRef} active={isRevealed} />
          </WebGLErrorBoundary>
        </div>
      )}

      <div className="page-wrap relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column spacer (or StaticBadge when WebGL/motion is disabled) */}
          <div className="lg:col-span-6 flex items-center justify-center">
            {canUseWebGL === false ? (
              <div className="h-[420px] sm:h-[480px] flex items-center justify-center">
                <StaticBadge />
              </div>
            ) : (
              <div className="hidden lg:block h-[620px]" aria-hidden="true" />
            )}
          </div>

          {/* Right Column — Display Name & Stacked Skill Focus */}
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 20, filter: 'blur(4px)' }}
            animate={
              isRevealed || prefersReducedMotion
                ? { opacity: 1, y: 0, filter: 'blur(0px)' }
                : { opacity: 0, y: 20, filter: 'blur(4px)' }
            }
            transition={{ duration: 0.65, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-6 flex flex-col items-start lg:pl-6"
          >
            <p className="text-[13px] font-medium uppercase tracking-[0.2em] text-[#a3a3a3]">
              UI/UX Designer &amp; Frontend Developer
            </p>

            <h1 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(64px,10vw,132px)] leading-[0.94] tracking-[-0.03em] font-normal text-[#f5f5f5]">
              Dippa
            </h1>

            {/* Three stacked skills — one sharp, two blurred & dimmed */}
            <div
              className="mt-8 sm:mt-10 flex flex-col gap-2 sm:gap-3"
              role="list"
              aria-label="Core disciplines"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              {SKILLS.map((skill, index) => {
                const isFocused = prefersReducedMotion || index === activeSkill;
                return (
                  <button
                    key={skill}
                    type="button"
                    role="listitem"
                    onClick={() => setActiveSkill(index)}
                    onFocus={() => {
                      setIsPaused(true);
                      setActiveSkill(index);
                    }}
                    onBlur={() => setIsPaused(false)}
                    aria-current={index === activeSkill ? 'true' : undefined}
                    className="group text-left min-h-[44px] flex items-center gap-4 focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-4 rounded-md cursor-pointer"
                  >
                    <span
                      aria-hidden="true"
                      className="h-[1px] transition-all duration-500 ease-out bg-[#f5f5f5]"
                      style={{
                        width: isFocused ? '28px' : '10px',
                        opacity: isFocused ? 0.9 : 0.25,
                      }}
                    />
                    <span
                      className="text-[clamp(28px,4.2vw,44px)] font-medium leading-[1.15] tracking-[-0.025em] transition-[filter,opacity,color] duration-500 ease-out"
                      style={{
                        color: '#f5f5f5',
                        opacity: isFocused ? 1 : 0.28,
                        filter: isFocused ? 'blur(0px)' : 'blur(3.2px)',
                      }}
                    >
                      {skill}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-10 sm:mt-12 flex flex-col sm:flex-row w-full sm:w-auto items-stretch sm:items-center gap-3.5 sm:gap-4">
              <a
                href="#projects"
                className="inline-flex min-h-[48px] w-full sm:w-auto items-center justify-center gap-2.5 rounded-xl bg-[#f5f5f5] px-6 text-[15px] font-medium text-[#0a0a0a] transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>View selected work</span>
                <ArrowDownRight className="w-4 h-4" aria-hidden="true" />
              </a>

              <a
                href="#contact"
                className="inline-flex min-h-[48px] w-full sm:w-auto items-center justify-center rounded-xl border border-white/15 px-6 text-[15px] font-medium text-[#f5f5f5] transition-colors duration-200 hover:border-white/35 hover:bg-white/[0.06]"
              >
                Send a message
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
