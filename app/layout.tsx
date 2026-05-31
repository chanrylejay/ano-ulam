import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ano Ulam? - Filipino Meal Suggestions',
  description: 'Daily Filipino meal suggestions based on current market prices. Magtipid sa ulam!',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}