import type { Metadata } from 'next';
import { Instrument_Sans, Instrument_Serif, Source_Serif_4 } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const sans = Instrument_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-instrument-sans',
});

const serif = Source_Serif_4({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-source-serif',
});

const display = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-instrument-serif',
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000',
  ),
  title: 'DocsLite',
  description: 'Write it. Share it. Nothing in the way. A lightweight collaborative document editor.',
  openGraph: {
    title: 'DocsLite',
    description: 'Write it. Share it. Nothing in the way. A lightweight collaborative document editor.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} ${display.variable} h-full antialiased`}>
      <body className="min-h-full">
        {children}
        <Toaster position="bottom-center" toastOptions={{ unstyled: true }} />
      </body>
    </html>
  );
}
