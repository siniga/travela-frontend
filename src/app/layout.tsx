import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Travela — Stay Connected Across Africa',
  description:
    'Buy and activate local eSIM data plans instantly across 50+ African countries. No roaming fees, no plastic cards.',
  keywords: ['eSIM', 'Africa', 'travel', 'data', 'roaming', 'connectivity'],
  openGraph: {
    title: 'Travela — Stay Connected Across Africa',
    description: 'Instant eSIM bundles for 50+ African countries.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
