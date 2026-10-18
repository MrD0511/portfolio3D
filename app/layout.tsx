import type { Metadata } from 'next';
import { Playfair_Display, Space_Mono } from 'next/font/google';
import './globals.css';

// These fonts are used both by the page UI and by the canvas that draws the
// "Archive" website onto the monitor. The CSS variables are read at runtime
// by DeskScene so the canvas gets the exact hashed family names next/font emits.
const serif = Playfair_Display({
  subsets: ['latin'],
  weight: ['700', '900'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

const mono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Archive Desk',
  description: 'A lamp-lit desk setup built with Three.js.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
