import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ano Ulam? — Murang Ulam Suggestions Araw-Araw',
  description:
    'Araw-araw na Filipino meal suggestions base sa current market prices. Tipid sa ulam, masarap pa!',
  themeColor: '#f59e0b',
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: 'Ano Ulam? — Filipino Meal Planner',
    description: 'Daily budget-friendly Filipino meal suggestions from DA price data.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
      </body>
    </html>
  );
}