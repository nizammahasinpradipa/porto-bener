'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';

interface ScrollMotionBlurProps {
  targetId?: string;
}

/**
 * Velocity-reactive directional vertical motion blur while scrolling.
 * Applies an SVG directional feGaussianBlur (Y-axis only) to <main> strictly
 * while scroll velocity is non-zero, and clears `filter` completely at rest so
 * typography stays razor-sharp and idle GPU cost is zero.
 */
export function ScrollMotionBlur({ targetId = 'main-content' }: ScrollMotionBlurProps) {
  const prefersReducedMotion = useReducedMotion();
  const blurNodeRef = useRef<SVGFEGaussianBlurElement>(null);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const target = document.getElementById(targetId);
    const blurEl = blurNodeRef.current;
    if (!target || !blurEl) return;

    let lastScrollY = window.scrollY;
    let lastTime = performance.now();
    let currentBlur = 0;
    let targetBlur = 0;
    let rafId: number | null = null;
    let isFilterApplied = false;

    const tick = () => {
      const now = performance.now();
      const dt = Math.max(8, now - lastTime);
      const currentY = window.scrollY;
      const dy = Math.abs(currentY - lastScrollY);

      // Compute instantaneous vertical scroll speed (px/ms)
      const speed = dy / dt;
      // Map scroll speed to subtle, restrained Y-only motion blur (0 to 1.8px)
      targetBlur = Math.min(1.8, Math.max(0, (speed - 0.35) * 0.85));

      // Quick spring-like decay back to crystal-sharp 0
      const smoothing = targetBlur > currentBlur ? 0.3 : 0.28;
      currentBlur += (targetBlur - currentBlur) * smoothing;

      lastScrollY = currentY;
      lastTime = now;

      if (currentBlur > 0.08) {
        if (!isFilterApplied) {
          target.style.filter = 'url(#dipporto-scroll-motion-blur)';
          isFilterApplied = true;
        }
        blurEl.setAttribute('stdDeviation', `0 ${currentBlur.toFixed(2)}`);
        rafId = window.requestAnimationFrame(tick);
      } else {
        currentBlur = 0;
        if (isFilterApplied) {
          blurEl.setAttribute('stdDeviation', '0 0');
          target.style.filter = '';
          isFilterApplied = false;
        }
        rafId = null;
      }
    };

    const onScroll = () => {
      if (rafId === null) {
        lastTime = performance.now();
        rafId = window.requestAnimationFrame(tick);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      target.style.filter = '';
    };
  }, [prefersReducedMotion, targetId]);

  if (prefersReducedMotion) return null;

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none fixed h-0 w-0 overflow-hidden"
    >
      <defs>
        <filter
          id="dipporto-scroll-motion-blur"
          x="-2%"
          y="-4%"
          width="104%"
          height="108%"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur ref={blurNodeRef} in="SourceGraphic" stdDeviation="0 0" />
        </filter>
      </defs>
    </svg>
  );
}
