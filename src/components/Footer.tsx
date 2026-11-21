export function Footer() {
  return (
    <footer className="border-t border-white/10 py-8">
      <div className="page-wrap flex flex-col sm:flex-row items-center justify-between gap-4 text-[14px] text-[#8a8a8a]">
        <div className="flex items-center gap-3">
          <span className="font-[family-name:var(--font-display)] text-[18px] text-[#f5f5f5]">
            MyPorto
          </span>
          <span aria-hidden="true">·</span>
          <span>© 2026 Dippa</span>
        </div>

        <a
          href="#home"
          className="link-underline inline-flex min-h-[44px] items-center text-[#b5b5b5] hover:text-[#f5f5f5] transition-colors"
        >
          Back to top
        </a>
      </div>
    </footer>
  );
}
