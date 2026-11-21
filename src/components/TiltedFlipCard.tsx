'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from 'framer-motion';
import { ArrowUpRight, RotateCw } from 'lucide-react';
import type { ProjectItem } from '@/data/projects';

interface TiltedFlipCardProps {
  project: ProjectItem;
  className?: string;
  onInspect: (project: ProjectItem) => void;
}

const SPRING_CONFIG = {
  damping: 26,
  stiffness: 180,
  mass: 1.05,
};

export function TiltedFlipCard({ project, className = '', onInspect }: TiltedFlipCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isCoarsePointer, setIsCoarsePointer] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)');
    setIsCoarsePointer(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsCoarsePointer(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const disableTilt = Boolean(prefersReducedMotion || isCoarsePointer);

  const rotateX = useSpring(useMotionValue(0), SPRING_CONFIG);
  const rotateY = useSpring(useMotionValue(0), SPRING_CONFIG);
  const scale = useSpring(1, SPRING_CONFIG);
  const glareX = useMotionValue(50);
  const glareY = useMotionValue(50);
  const glareOpacity = useSpring(0, { damping: 30, stiffness: 200 });

  const glareBg = useMotionTemplate`radial-gradient(circle 280px at ${glareX}% ${glareY}%, rgba(255,255,255,0.14), transparent 72%)`;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disableTilt || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;

    const rotX = (0.5 - py) * 14;
    const rotY = (px - 0.5) * 14;

    rotateX.set(rotX);
    rotateY.set(rotY);
    glareX.set(px * 100);
    glareY.set(py * 100);
  };

  const handleMouseEnter = () => {
    if (disableTilt) return;
    scale.set(1.018);
    glareOpacity.set(1);
  };

  const handleMouseLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
    scale.set(1);
    glareOpacity.set(0);
  };

  const toggleFlip = () => {
    setIsFlipped((prev) => !prev);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleFlip();
    }
  };

  const aspectClass = project.aspect === 'portrait' ? 'aspect-[3/4]' : 'aspect-[16/9]';

  return (
    <motion.article
      layout={!prefersReducedMotion}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 18, filter: 'blur(3px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.96, filter: 'blur(3px)' }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={`perspective-1200 ${className}`}
    >
      <motion.div
        ref={cardRef}
        role="button"
        tabIndex={0}
        aria-pressed={isFlipped}
        aria-label={`${project.title} (${project.type}). ${
          isFlipped ? 'Showing details. Press to flip back.' : 'Press to flip card for details.'
        }`}
        onClick={toggleFlip}
        onKeyDown={handleKeyDown}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={
          disableTilt
            ? undefined
            : {
                rotateX,
                rotateY,
                scale,
                transformStyle: 'preserve-3d',
              }
        }
        className="relative w-full cursor-pointer rounded-[20px] focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-4"
      >
        {/* 3D Flipping Container */}
        <motion.div
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { type: 'spring', stiffness: 220, damping: 24, mass: 0.9 }
          }
          className="relative w-full preserve-3d"
        >
          {/* FRONT FACE */}
          <div className="glass-surface glass-surface-interactive relative w-full overflow-hidden rounded-[20px] backface-hidden p-3 sm:p-3.5">
            {/* Specular monochrome glare */}
            {!disableTilt && (
              <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-10 rounded-[20px]"
                style={{ background: glareBg, opacity: glareOpacity }}
              />
            )}

            {/* Uncropped Artwork Frame */}
            <div className={`relative w-full overflow-hidden rounded-[14px] bg-[#0f0f0f] ${aspectClass}`}>
              <img
                src={project.image}
                alt={`${project.title} — ${project.type}`}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 ease-out hover:scale-[1.02]"
              />
            </div>

            {/* Card Header/Meta Bar */}
            <div className="mt-3.5 flex items-center justify-between gap-2 px-1 pb-0.5">
              <div className="min-w-0">
                <h3 className="font-[family-name:var(--font-display)] text-[21px] sm:text-[22px] leading-tight tracking-[-0.015em] text-[#f5f5f5] whitespace-nowrap">
                  {project.title}
                </h3>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                <span className="inline-flex items-center rounded-full border border-white/15 bg-white/[0.06] px-2.5 py-0.5 text-[12px] font-medium text-[#d4d4d4]">
                  {project.type}
                </span>
                <span
                  aria-hidden="true"
                  className={`${
                    project.aspect === 'portrait' ? 'inline-flex lg:hidden 2xl:inline-flex' : 'inline-flex'
                  } h-7 w-7 items-center justify-center rounded-full border border-white/10 text-[#a3a3a3]`}
                >
                  <RotateCw className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          </div>

          {/* BACK FACE */}
          <div
            className={`glass-surface absolute inset-0 flex flex-col justify-between overflow-y-auto rounded-[20px] backface-hidden rotate-y-180 bg-[#111111]/95 ${
              project.aspect === 'landscape' ? 'p-4 sm:p-6' : 'p-5 sm:p-6'
            }`}
          >
            <div className="min-h-0">
              <div
                className={`flex items-center justify-between gap-2 border-b border-white/10 ${
                  project.aspect === 'landscape' ? 'pb-2 sm:pb-3.5' : 'pb-3.5'
                }`}
              >
                <span className="text-[12px] sm:text-[13px] font-medium uppercase tracking-[0.14em] text-[#a3a3a3]">
                  {project.type} · {project.year}
                </span>
                <span
                  aria-hidden="true"
                  className="inline-flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full border border-white/15 text-[#d4d4d4]"
                >
                  <RotateCw className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                </span>
              </div>

              <h3
                className={`font-[family-name:var(--font-display)] leading-[1.08] tracking-[-0.02em] text-[#f5f5f5] ${
                  project.aspect === 'landscape'
                    ? 'mt-2.5 sm:mt-4 text-[22px] sm:text-[30px]'
                    : 'mt-4 text-[30px]'
                }`}
              >
                {project.title}
              </h3>

              <p
                className={`leading-[1.45] sm:leading-[1.55] text-[#c7c7c7] ${
                  project.aspect === 'landscape'
                    ? 'mt-1.5 sm:mt-3 text-[13px] sm:text-[15px] line-clamp-2 sm:line-clamp-none'
                    : 'mt-3 text-[15px]'
                }`}
              >
                {project.description}
              </p>

              <div className={project.aspect === 'landscape' ? 'mt-2.5 sm:mt-5' : 'mt-5'}>
                <p
                  className={`text-[12px] sm:text-[13px] font-medium uppercase tracking-[0.12em] text-[#8a8a8a] ${
                    project.aspect === 'landscape' ? 'hidden sm:block' : 'block'
                  }`}
                >
                  Tools
                </p>
                <ul
                  className={`flex flex-wrap gap-1.5 ${
                    project.aspect === 'landscape' ? 'mt-0 sm:mt-2' : 'mt-2'
                  }`}
                  aria-label="Tools used"
                >
                  {project.tools.map((tool) => (
                    <li
                      key={tool}
                      className="rounded-full border border-white/12 bg-white/[0.05] px-2 sm:px-2.5 py-0.5 sm:py-1 text-[11px] sm:text-[13px] text-[#e5e5e5]"
                    >
                      {tool}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div
              className={`flex shrink-0 items-center justify-between gap-3 border-t border-white/10 ${
                project.aspect === 'landscape' ? 'mt-3 pt-2.5 sm:mt-5 sm:pt-4' : 'mt-5 pt-4'
              }`}
            >
              {project.href ? (
                <a
                  href={project.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex min-h-[40px] sm:min-h-[44px] items-center gap-2 rounded-xl bg-[#f5f5f5] px-3.5 sm:px-4 text-[13px] sm:text-[14px] font-medium text-[#0a0a0a] transition-opacity duration-200 hover:opacity-85"
                >
                  <span>{project.linkLabel}</span>
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </a>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onInspect(project);
                  }}
                  className="inline-flex min-h-[40px] sm:min-h-[44px] items-center gap-2 rounded-xl bg-[#f5f5f5] px-3.5 sm:px-4 text-[13px] sm:text-[14px] font-medium text-[#0a0a0a] transition-opacity duration-200 hover:opacity-85 cursor-pointer"
                >
                  <span>{project.linkLabel}</span>
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.article>
  );
}
