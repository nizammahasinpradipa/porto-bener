'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { DitherBackground } from './DitherBackground';

const LOADER_WAVE_COLOR: [number, number, number] = [0.48, 0.48, 0.48];

interface PageLoaderProps {
  onReveal: () => void;
}

export function PageLoader({ onReveal }: PageLoaderProps) {
  const prefersReducedMotion = useReducedMotion();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (prefersReducedMotion) {
      setProgress(100);
      setVisible(false);
      onReveal();
      return;
    }

    let isPageReady = document.readyState === 'complete';
    let isFontsReady = false;
    let revealed = false;
    let rafId = 0;
    let finishTimer: number | null = null;

    // Lock scroll while the loader covers the viewport
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onWindowLoad = () => {
      isPageReady = true;
    };

    if (!isPageReady) {
      window.addEventListener('load', onWindowLoad, { once: true });
    }

    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        isFontsReady = true;
      });
    } else {
      isFontsReady = true;
    }

    const startTime = performance.now();
    const minDuration = 1350; // Crisp editorial ramp from 0 to 100%

    const triggerReveal = () => {
      if (revealed) return;
      revealed = true;
      setProgress(100);
      finishTimer = window.setTimeout(() => {
        document.body.style.overflow = prevOverflow;
        onReveal();
        setVisible(false);
      }, 160);
    };

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const linearT = Math.min(1, elapsed / minDuration);
      const eased = 1 - Math.pow(1 - linearT, 3);

      const readyCap = isPageReady && isFontsReady ? 100 : 94;
      const nextValue = Math.min(readyCap, Math.round(eased * 100));

      setProgress((prev) => (nextValue > prev ? nextValue : prev));

      if (linearT >= 1 && isPageReady && isFontsReady) {
        triggerReveal();
        return;
      }

      if (elapsed >= 3200) {
        triggerReveal();
        return;
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('load', onWindowLoad);
      window.cancelAnimationFrame(rafId);
      if (finishTimer !== null) window.clearTimeout(finishTimer);
      document.body.style.overflow = prevOverflow;
    };
  }, [prefersReducedMotion, onReveal]);

  const formatted = String(progress).padStart(2, '0');

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="myporto-loader"
          role="status"
          aria-live="polite"
          aria-label={`Loading MyPorto, ${progress} percent`}
          initial={{ y: '0%', opacity: 1, filter: 'blur(0px)' }}
          exit={{
            y: '-100%',
            opacity: 0.95,
            filter: 'blur(2.5px)',
            transition: { duration: 0.72, ease: [0.76, 0, 0.24, 1] },
          }}
          className="fixed inset-0 z-[100] flex flex-col justify-between overflow-hidden bg-[#0a0a0a] py-8 sm:py-10 select-none"
        >
          {/* React Bits-style monochrome Perlin + 8x8 Bayer ordered dither wave background */}
          <DitherBackground
            waveSpeed={0.06}
            waveFrequency={3}
            waveAmplitude={0.3}
            colorNum={4}
            pixelSize={2.5}
            waveColor={LOADER_WAVE_COLOR}
            enableMouseInteraction
            mouseRadius={0.3}
          />

          {/* Subtle center radial contrast veil so the white centered counter stays razor-sharp */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at center, rgba(10,10,10,0.52) 0%, rgba(10,10,10,0.18) 55%, rgba(10,10,10,0.58) 100%)',
            }}
          />

          {/* Top row aligned to shared page edges */}
          <div className="page-wrap relative z-10 flex items-center justify-between text-[14px] text-[#a3a3a3]">
            <span className="font-[family-name:var(--font-display)] text-[22px] sm:text-[24px] tracking-[-0.02em] text-[#f5f5f5]">
              MyPorto
            </span>
            <span className="text-[12px] uppercase tracking-[0.2em] text-[#a3a3a3]">
              Portfolio · 2026
            </span>
          </div>

          {/* Dead-Center Counter & Minimal Progress Bar */}
          <div className="page-wrap relative z-10 flex flex-1 flex-col items-center justify-center text-center">
            <div className="font-[family-name:var(--font-display)] text-[clamp(84px,18vw,204px)] leading-[0.88] tracking-[-0.04em] tabular-nums text-[#f5f5f5]">
              {formatted}
              <span className="ml-1 text-[clamp(30px,5.5vw,60px)] text-[#a3a3a3]">%</span>
            </div>

            <div className="mt-7 h-[1px] w-48 sm:w-64 overflow-hidden bg-white/15">
              <div
                className="h-full w-full origin-left bg-[#f5f5f5] transition-transform duration-100 ease-out"
                style={{ transform: `scaleX(${progress / 100})` }}
              />
            </div>

            <span className="mt-4 text-[12px] uppercase tracking-[0.24em] text-[#a3a3a3]">
              {progress < 100 ? 'Loading' : 'Ready'}
            </span>
          </div>

          {/* Quiet bottom row */}
          <div className="page-wrap relative z-10 flex items-center justify-between text-[12px] uppercase tracking-[0.18em] text-[#8a8a8a]">
            <span>UI/UX · Design · Frontend</span>
            <span>Dippa</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
