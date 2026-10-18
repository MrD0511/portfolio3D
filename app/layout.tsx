import type { Metadata } from 'next';
import { Playfair_Display, Space_Mono } from 'next/font/google';
import './globals.css';

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
  title: 'Dhruv Sharma | 3D Portfolio',
  description: 'A 3D portfolio website built with Next.js, React Three Fiber, and TypeScript. Explore the interactive 3D desk scene and discover my projects and skills.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
