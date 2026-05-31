export function Footer() {
  return (
    <footer className="border-t border-amber-200 bg-white/80 py-4">
      <div className="max-w-2xl mx-auto px-4">
        <p className="text-center text-xs text-amber-600">
          Data mula sa{" "}
          <a
            href="https://www.da.gov.ph/price-monitoring/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold hover:underline"
            aria-label="Department of Agriculture Bantay Presyo price monitoring website (opens in new tab)"
          >
            Department of Agriculture Bantay Presyo
          </a>
        </p>
      </div>
    </footer>
  );
}