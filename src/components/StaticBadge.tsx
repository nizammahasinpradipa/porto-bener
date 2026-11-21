'use client';

import { useState } from 'react';

interface StaticBadgeProps {
  interactive?: boolean;
}

export function StaticBadge({ interactive = true }: StaticBadgeProps) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full select-none">
      {/* Subtle monochrome strap anchor */}
      <div
        aria-hidden="true"
        className="w-7 h-20 sm:h-24 bg-gradient-to-b from-white/10 via-white/20 to-white/15 border-x border-white/15 relative"
      >
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1px] bg-white/15" />
      </div>

      {/* Metal clip */}
      <div
        aria-hidden="true"
        className="w-10 h-5 rounded-sm bg-gradient-to-b from-neutral-300 to-neutral-600 border border-white/30 shadow-md -mt-1 z-10"
      />

      {/* Badge body */}
      <button
        type="button"
        onClick={() => interactive && setFlipped((f) => !f)}
        aria-label={
          flipped
            ? 'MyPorto monochrome badge back side. Click to flip to front.'
            : 'MyPorto monochrome badge front side. Click to flip to back.'
        }
        className="perspective-1200 mt-[-4px] w-[236px] sm:w-[264px] aspect-[54/86] cursor-pointer focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-4 rounded-[18px]"
      >
        <div
          className={`relative w-full h-full preserve-3d transition-transform duration-500 ${
            flipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* Front side */}
          <div className="absolute inset-0 backface-hidden rounded-[18px] bg-[#0e0e0e] border border-white/20 shadow-[0_30px_70px_rgba(0,0,0,0.85)] p-4 sm:p-5 flex flex-col justify-between text-left overflow-hidden">
            <div>
              <div
                aria-hidden="true"
                className="mx-auto w-12 h-2 rounded-full bg-black border border-white/20 mb-2"
              />
              <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-neutral-400">
                <span>ID · 01</span>
                <span>2026</span>
              </div>
            </div>

            <div className="my-3 flex-1 overflow-hidden rounded-xl border border-white/15 bg-black">
              <img
                src="/lanyard-front.jpg"
                alt="Dippa monochrome portrait"
                className="h-full w-full object-cover object-[50%_22%] grayscale contrast-110"
              />
            </div>

            <div className="flex items-end justify-between gap-2">
              <div>
                <div className="font-[family-name:var(--font-display)] text-[28px] leading-none tracking-[-0.02em] text-[#f5f5f5]">
                  MyPorto
                </div>
                <div className="mt-1 text-[11px] uppercase tracking-[0.12em] text-neutral-400">
                  Dippa · UI/UX · Code
                </div>
              </div>
              <div className="w-6 h-6 shrink-0 rounded-full border border-white/25 flex items-center justify-center text-[10px] text-white/80">
                M
              </div>
            </div>
          </div>

          {/* Back side */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-[18px] bg-[#111111] border border-white/20 shadow-[0_30px_70px_rgba(0,0,0,0.85)] p-5 flex flex-col justify-between text-left overflow-hidden">
            <div
              aria-hidden="true"
              className="mx-auto w-12 h-2 rounded-full bg-black border border-white/20 mb-2"
            />
            <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-400">
              MyPorto · Pass
            </div>

            <div className="my-auto space-y-3 text-[13px] text-neutral-300">
              <div className="border-y border-white/15 py-3">
                <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-500">
                  Disciplines
                </div>
                <div className="mt-1 text-white">UI/UX · Posters · Frontend</div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-500">
                  Status
                </div>
                <div className="mt-1 text-white">Open for select work</div>
              </div>
            </div>

            {/* Minimal barcode lines */}
            <div aria-hidden="true" className="flex items-end gap-[3px] h-7 opacity-70">
              {[2, 1, 3, 1, 2, 1, 1, 3, 2, 1, 2, 3, 1, 2, 1, 3, 1, 2, 1, 2].map((w, idx) => (
                <span
                  key={idx}
                  className="bg-white/80 h-full"
                  style={{ width: `${w * 2}px` }}
                />
              ))}
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}
