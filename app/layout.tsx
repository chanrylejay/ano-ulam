import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "Ano Ulam? — Murang Ulam Suggestions Araw-Araw",
  description:
    "Araw-araw na Filipino meal suggestions base sa current market prices. Tipid sa ulam, masarap pa!",
  // No `icons` block on purpose. Setting it here OVERRIDES Next.js's file
  // convention, which is what pinned the site to the soft 16/48px .ico. With
  // this absent, both app/icon.svg and app/favicon.ico are emitted and every
  // browser that can take the vector takes the vector.
  openGraph: {
    title: "Ano Ulam? — Filipino Meal Planner",
    description: "Daily budget-friendly Filipino meal suggestions from DA price data.",
    type: "website",
  },
};

// themeColor moved out of `metadata` here. Next.js 14 deprecated it there and
// printed a warning on every single page of every build; this is where it
// belongs now.
export const viewport: Viewport = {
  themeColor: "#f59e0b",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fil">
      <body className="font-sans antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-amber-600 focus:text-white focus:rounded-lg focus:outline-none"
        >
          Skip to main content
        </a>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
