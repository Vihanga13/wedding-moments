import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Inter, Alex_Brush } from 'next/font/google';
import './globals.css';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-cormorant',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const alexBrush = Alex_Brush({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-alex-brush',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#FAF8F5',
};

export const metadata: Metadata = {
  title: 'Our Wedding Moments — Guest Photo Sharing',
  description:
    'Capture and share beautiful memories from our wedding day. Upload your photos effortlessly by scanning our wedding QR code.',
  keywords: ['wedding', 'photo sharing', 'wedding gallery', 'QR code upload', 'guest photos'],
  authors: [{ name: 'Wedding Moments' }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable} ${alexBrush.variable}`}>
      <body className="min-h-screen flex flex-col bg-ivory-50 text-stoneDark selection:bg-gold-200 selection:text-stoneDark">
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}
