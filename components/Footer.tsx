export function Footer() {
  return (
    <footer className="border-t border-amber-200 bg-white/80 py-6">
      <div className="max-w-2xl mx-auto px-4 space-y-4">
        {/* Contact */}
        <div className="text-center">
          <p className="text-sm font-semibold text-amber-800 mb-1">
            Do you have some ulam suggestions?
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-amber-600">
            <a
              href="mailto:chanrylecagara@gmail.com"
              className="inline-flex items-center gap-1 hover:underline hover:text-amber-800 transition-colors"
              aria-label="Send email"
            >
              ✉️ chanrylecagara@gmail.com
            </a>
            <span className="text-amber-300">|</span>
            <a
              href="https://linkedin.com/in/chanrylejay"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:underline hover:text-amber-800 transition-colors"
              aria-label="LinkedIn profile (opens in new tab)"
            >
              💼 LinkedIn
            </a>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-amber-100" />

        {/* DA Attribution */}
        <p className="text-center text-xs text-amber-600">
          Data mula sa{" "}
          <a
            href="https://www.da.gov.ph/price-monitoring/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold hover:underline"
            aria-label="Department of Agriculture Bantay Presyo price monitoring website (opens in new tab)"
          >
            DA Bantay Presyo
          </a>
        </p>

        {/* Built by */}
        <p className="text-center text-[11px] text-amber-400">
          Built by{" "}
          <a
            href="https://chanryle-cagara.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold hover:underline hover:text-amber-600 transition-colors"
          >
            Chanryle Jay Cagara
          </a>
        </p>
      </div>
    </footer>
  );
}
