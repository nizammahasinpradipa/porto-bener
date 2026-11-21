'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const NAV_ITEMS = [
  { id: 'home', label: 'Home' },
  { id: 'projects', label: 'Project' },
  { id: 'contact', label: 'Contact' },
] as const;

type SectionId = (typeof NAV_ITEMS)[number]['id'];

export function Navbar() {
  const [active, setActive] = useState<SectionId>('home');

  useEffect(() => {
    let rafId: number | null = null;

    const updateActiveSection = () => {
      rafId = null;
      const scrollY = window.scrollY;
      const viewportH = window.innerHeight;
      const docH = document.documentElement.scrollHeight;

      // Guarantee exact endpoints at very top and very bottom of the page
      if (scrollY < 40) {
        setActive('home');
        return;
      }
      if (scrollY + viewportH >= docH - 40) {
        setActive('contact');
        return;
      }

      // Probe line at 35% from top of viewport works accurately in both scroll directions
      // (Home -> Project -> Contact and Contact -> Project -> Home), even for tall mobile sections.
      const probeY = scrollY + viewportH * 0.35;
      let current: SectionId = 'home';

      for (const item of NAV_ITEMS) {
        const el = document.getElementById(item.id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top + scrollY;
        if (top <= probeY) {
          current = item.id;
        }
      }

      setActive(current);
    };

    const onScrollOrResize = () => {
      if (rafId === null) {
        rafId = window.requestAnimationFrame(updateActiveSection);
      }
    };

    updateActiveSection();
    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <header className="fixed inset-x-0 top-4 z-50 pointer-events-none">
      <div className="page-wrap">
        <nav
          aria-label="Primary navigation"
          className="glass-surface pointer-events-auto flex h-14 sm:h-16 items-center justify-between rounded-2xl px-4 sm:px-6"
        >
          <a
            href="#home"
            onClick={() => setActive('home')}
            className="inline-flex min-h-[44px] items-center font-[family-name:var(--font-display)] text-[22px] sm:text-[24px] tracking-[-0.02em] text-[#f5f5f5] transition-opacity duration-200 hover:opacity-80"
          >
            MyPorto
          </a>

          <ul className="flex items-center gap-1 sm:gap-2">
            {NAV_ITEMS.map((item) => {
              const isCurrent = active === item.id;
              return (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    aria-current={isCurrent ? 'page' : undefined}
                    onClick={() => setActive(item.id)}
                    className={`relative inline-flex min-h-[44px] items-center px-3 sm:px-4 text-[14px] sm:text-[15px] font-medium tracking-[-0.01em] transition-colors duration-200 ${
                      isCurrent
                        ? 'text-[#f5f5f5]'
                        : 'text-[#a3a3a3] hover:text-[#f5f5f5]'
                    }`}
                  >
                    <span>{item.label}</span>
                    {isCurrent && (
                      <motion.span
                        layoutId="nav-active-underline"
                        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                        className="absolute inset-x-3 sm:inset-x-4 bottom-2 h-[1.5px] bg-[#f5f5f5]"
                      />
                    )}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
