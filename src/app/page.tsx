import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Heart } from 'lucide-react';

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

  return (
    <div className="w-full flex flex-col items-center space-y-16 sm:space-y-24 py-8 sm:py-16 px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <section className="w-full max-w-4xl mx-auto text-center space-y-6 pt-4 animate-fade-in">
        {/* Date badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold-100/80 border border-gold-300/60 text-gold-800 text-xs font-sans tracking-widest uppercase shadow-sm">
          <Heart className="w-3.5 h-3.5 text-gold-600 fill-gold-500/20" />
          <span>{config.weddingDate || 'November 28, 2026'}</span>
        </div>

        {/* Wedding Title & Couple Names */}
        <div className="space-y-4">
          <h1 className="font-script-wedding text-5xl sm:text-7xl lg:text-8xl text-stoneDark font-normal flex flex-col items-center justify-center leading-tight sm:leading-tight">
            <span>Brunthavan</span>
            <span className="text-3xl sm:text-5xl lg:text-6xl text-gold-600 my-0.5 sm:my-1 font-normal select-none">
              &amp;
            </span>
            <span>Shibaani Surudisya</span>
          </h1>
          <p className="font-serif-wedding text-2xl sm:text-3xl tracking-wide text-gold-700 font-medium pt-2">
            {config.weddingTitle || 'Our Wedding Memories'}
          </p>
          {config.venue && (
            <p className="font-sans text-xs sm:text-sm text-stoneDark/60 tracking-wider uppercase font-medium">
              {config.venue}
            </p>
          )}
        </div>

        {/* Message from the Couple */}
        <div className="max-w-2xl mx-auto p-6 sm:p-8 rounded-3xl glass-panel-gold border border-gold-200/80 shadow-soft text-center">
          <p className="font-serif-wedding text-lg sm:text-xl text-stoneDark/90 italic leading-relaxed whitespace-pre-line">
            {config.welcomeMessage}
          </p>
          <div className="mt-6 flex flex-col items-center justify-center text-center space-y-1">
            <span className="text-gold-600 font-script-wedding text-3xl">
              With love,
            </span>
            <span className="font-serif-wedding text-lg sm:text-xl not-italic text-stoneDark font-medium tracking-wide">
              {config.coupleNames}
            </span>
          </div>
        </div>

        {/* Primary Call-to-Action Button */}
        <div className="flex items-center justify-center pt-4">
          <Link
            href="/upload"
            className="w-full sm:w-auto flex items-center justify-center px-10 py-4 rounded-full bg-gradient-to-r from-gold-500 via-gold-600 to-gold-500 text-white font-serif-wedding text-xl tracking-wide font-medium shadow-card hover:shadow-glow hover:brightness-105 active:scale-[0.99] transition-all"
          >
            Upload Your Photos
          </Link>
        </div>
      </section>
    </div>
  );
}
