import Link from 'next/link';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { Camera, Image as ImageIcon, Heart, Printer } from 'lucide-react';
import QRCodeCard from '@/components/QRCodeCard';
import { getPublicUploadUrl } from '@/lib/qrcode';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let config = await prisma.weddingConfig.findUnique({
    where: { id: 'default' },
  });

  if (!config) {
    config = await prisma.weddingConfig.create({
      data: { id: 'default' },
    });
  }

  // Detect live host on Netlify / production so QR code always opens the live site
  const headerList = headers();
  const host = headerList.get('x-forwarded-host') || headerList.get('host');
  const proto = headerList.get('x-forwarded-proto') || 'https';
  const dynamicOrigin = host && !host.includes('localhost') ? `${proto}://${host}` : undefined;
  const uploadUrl = getPublicUploadUrl(dynamicOrigin);

  return (
    <div className="w-full flex flex-col items-center space-y-16 sm:space-y-24 py-8 sm:py-16 px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <section className="w-full max-w-4xl mx-auto text-center space-y-6 pt-4 animate-fade-in">
        {/* Date badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold-100/80 border border-gold-300/60 text-gold-800 text-xs font-sans tracking-widest uppercase shadow-sm">
          <Heart className="w-3.5 h-3.5 text-gold-600 fill-gold-500/20" />
          <span>{config.weddingDate || 'October 24, 2026'}</span>
        </div>

        {/* Wedding Title & Couple Names */}
        <div className="space-y-3">
          <h1 className="font-script-wedding text-5xl sm:text-7xl lg:text-8xl text-stoneDark font-normal">
            {config.coupleNames || 'Sarah & Michael'}
          </h1>
          <p className="font-serif-wedding text-2xl sm:text-3xl tracking-wide text-gold-700 font-medium">
            {config.weddingTitle || 'Our Wedding Memories'}
          </p>
          {config.venue && (
            <p className="font-sans text-xs sm:text-sm text-stoneDark/60 tracking-wider uppercase font-medium">
              {config.venue}
            </p>
          )}
        </div>

        {/* Message from the Couple */}
        <div className="max-w-2xl mx-auto p-6 sm:p-8 rounded-3xl glass-panel-gold border border-gold-200/80 shadow-soft">
          <p className="font-serif-wedding text-lg sm:text-xl text-stoneDark/90 italic leading-relaxed">
            &ldquo;{config.welcomeMessage}&rdquo;
          </p>
          <div className="mt-3 flex items-center justify-center gap-1.5 text-gold-600 font-script-wedding text-2xl">
            <span>With love,</span>
            <span className="font-serif-wedding text-base not-italic text-stoneDark font-medium">
              {config.coupleNames}
            </span>
          </div>
        </div>

        {/* Primary Call-to-Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/upload"
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-full bg-gradient-to-r from-gold-500 via-gold-600 to-gold-500 text-white font-serif-wedding text-xl tracking-wide font-medium shadow-card hover:shadow-glow hover:brightness-105 active:scale-[0.99] transition-all group"
          >
            <Camera className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            Upload Your Photos
          </Link>

          <Link
            href="/gallery"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-white border border-gold-300 text-stoneDark font-serif-wedding text-xl tracking-wide font-medium hover:bg-gold-50/60 shadow-sm transition-all"
          >
            <ImageIcon className="w-5 h-5 text-gold-600" />
            View Wedding Gallery
          </Link>
        </div>

        <div className="pt-2">
          <Link
            href="/print-sign"
            className="inline-flex items-center gap-1.5 text-xs text-gold-700/80 hover:text-gold-900 font-sans transition-colors underline underline-offset-4"
          >
            <Printer className="w-3.5 h-3.5" />
            Print QR stationery cards for guest tables
          </Link>
        </div>
      </section>

      {/* QR Code Card */}
      <section className="w-full max-w-lg mx-auto flex justify-center">
        <QRCodeCard uploadUrl={uploadUrl} coupleNames={config.coupleNames} />
      </section>
    </div>
  );
}
