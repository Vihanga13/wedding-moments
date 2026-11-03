import { prisma } from '@/lib/prisma';
import GalleryGrid from '@/components/GalleryGrid';
import Link from 'next/link';
import { Camera, ArrowLeft, Lock } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function GalleryPage() {
  let config = await prisma.weddingConfig.findUnique({
    where: { id: 'default' },
  });

  if (!config) {
    config = await prisma.weddingConfig.create({
      data: { id: 'default' },
    });
  }

  return (
    <div className="w-full flex flex-col flex-1 pb-16">
      {/* Subheader */}
      <div className="w-full bg-ivory-100/60 border-b border-gold-200/50 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs font-sans">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-stoneDark/60 hover:text-stoneDark transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <Link
            href="/upload"
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gold-500 text-white font-medium hover:bg-gold-600 transition-all shadow-sm"
          >
            <Camera className="w-3.5 h-3.5" />
            Upload Your Snaps
          </Link>
        </div>
      </div>

      {/* Main Gallery Grid */}
      <GalleryGrid />
    </div>
  );
}
