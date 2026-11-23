'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { PROJECTS, type ProjectItem } from '@/data/projects';
import { TiltedFlipCard } from './TiltedFlipCard';

type FilterOption = 'All' | 'Posters' | 'Websites';

const FILTERS: FilterOption[] = ['All', 'Posters', 'Websites'];

export function ProjectsSection() {
  const prefersReducedMotion = useReducedMotion();
  const [filter, setFilter] = useState<FilterOption>('All');
  const [inspected, setInspected] = useState<ProjectItem | null>(null);

  const visibleProjects = PROJECTS.filter((project) => {
    if (filter === 'All') return true;
    if (filter === 'Posters') return project.type === 'Poster';
    return project.type === 'Website';
  });

  // Close lightbox on Escape key
  useEffect(() => {
    if (!inspected) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setInspected(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [inspected]);

  const getCollageClass = (project: ProjectItem, index: number) => {
    if (filter === 'All') {
      if (project.aspect === 'landscape') {
        return index === 0 ? 'lg:col-span-8 lg:mt-6' : 'lg:col-span-8 lg:mt-10';
      }
      return 'lg:col-span-4';
    }
    if (filter === 'Posters') {
      return index % 2 === 0 ? 'lg:col-span-5 lg:col-start-2' : 'lg:col-span-5 lg:mt-10';
    }
    if (visibleProjects.length === 1) {
      return 'lg:col-span-8 lg:col-start-3';
    }
    return index % 2 === 0 ? 'lg:col-span-6' : 'lg:col-span-6 lg:mt-10';
  };

  const archiveRange = `01–${String(PROJECTS.length).padStart(2, '0')}`;

  return (
    <section
      id="projects"
      aria-labelledby="projects-heading"
      className="relative min-h-[100svh] flex flex-col justify-center py-24 sm:py-28"
    >
      <div className="page-wrap">
        {/* Section Heading & Filter Toggles */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <p className="text-[13px] font-medium uppercase tracking-[0.2em] text-[#a3a3a3]">
              Archive · {archiveRange}
            </p>
            <h2
              id="projects-heading"
              className="mt-2 font-[family-name:var(--font-display)] text-[clamp(40px,6vw,64px)] leading-[1.02] tracking-[-0.025em] font-normal text-[#f5f5f5]"
            >
              Selected work
            </h2>
          </div>

          <div
            role="tablist"
            aria-label="Filter projects by format"
            className="glass-surface inline-flex self-start sm:self-auto items-center gap-1 rounded-full p-1.5"
          >
            {FILTERS.map((option) => {
              const isActive = filter === option;
              return (
                <button
                  key={option}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setFilter(option)}
                  className={`relative min-h-[44px] rounded-full px-4 sm:px-5 text-[14px] font-medium transition-colors duration-200 cursor-pointer ${
                    isActive ? 'text-[#0a0a0a]' : 'text-[#b5b5b5] hover:text-[#f5f5f5]'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="project-filter-pill"
                      transition={
                        prefersReducedMotion
                          ? { duration: 0 }
                          : { type: 'spring', stiffness: 420, damping: 34 }
                      }
                      className="absolute inset-0 rounded-full bg-[#f5f5f5]"
                    />
                  )}
                  <span className="relative z-10">{option}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Staggered Uncropped Collage Grid */}
        <motion.div
          layout={!prefersReducedMotion}
          className="mt-12 sm:mt-14 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-7 items-start"
        >
          <AnimatePresence mode="popLayout">
            {visibleProjects.map((project, index) => (
              <TiltedFlipCard
                key={project.id}
                project={project}
                className={getCollageClass(project, index)}
                onInspect={setInspected}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Crisp Monochrome Full-View Lightbox */}
      <AnimatePresence>
        {inspected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
            role="dialog"
            aria-modal="true"
            aria-label={`${inspected.title} full preview`}
            onClick={() => setInspected(null)}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/88 backdrop-blur-md p-4 sm:p-8"
          >
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.96, filter: 'blur(3px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.97, filter: 'blur(3px)' }}
              transition={{ duration: 0.24 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-surface relative max-h-[90svh] max-w-[1040px] w-full overflow-hidden rounded-[22px] p-4 sm:p-6 flex flex-col"
            >
              <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div>
                  <h3 className="font-[family-name:var(--font-display)] text-[28px] leading-none text-[#f5f5f5]">
                    {inspected.title}
                  </h3>
                  <p className="mt-1 text-[13px] text-[#a3a3a3]">
                    {inspected.type} · {inspected.tools.join(' · ')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setInspected(null)}
                  aria-label="Close preview"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-[#f5f5f5] transition-colors hover:bg-white/15 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 flex-1 overflow-auto flex items-center justify-center">
                <img
                  src={inspected.image}
                  alt={inspected.title}
                  className="max-h-[72svh] w-auto rounded-[12px] object-contain"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
