import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '🐾 Tierarzt.ai - Intelligenter Termin-Assistent',
  description: 'Dynamisches KI-gestütztes Formular zur optimalen Terminvorbereitung in der Tierarztpraxis',
  keywords: 'Tierarzt, KI, Formular, Termin, Haustier, Veterinär',
  authors: [{ name: 'Tierarzt.ai Team' }],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body className={`${inter.className} bg-gradient-to-br from-blue-50 via-white to-green-50 min-h-screen`}>
        <div className="min-h-screen flex flex-col">
          <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-center">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <span className="text-3xl">🐾</span>
                  Tierarzt.ai
                </h1>
              </div>
            </div>
          </header>
          
          <main className="flex-1 container mx-auto px-4 py-8">
            {children}
          </main>
          
          <footer className="bg-gray-50 border-t border-gray-200 py-6">
            <div className="container mx-auto px-4 text-center text-gray-600">
              <p>© 2025 Tierarzt.ai - Intelligente Terminoptimierung für Tierarztpraxen</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
} 