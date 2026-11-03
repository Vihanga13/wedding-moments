import { prisma } from '@/lib/prisma';
import PhotoUploadZone from '@/components/PhotoUploadZone';
import Link from 'next/link';
import { Camera, Image as ImageIcon, Heart, ArrowLeft, AlertCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function UploadPage() {
  let config = await prisma.weddingConfig.findUnique({
    where: { id: 'default' },
  });

  if (!config) {
    config = await prisma.weddingConfig.create({
      data: { id: 'default' },
    });
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 animate-fade-in">
      {/* Top Breadcrumb & Link */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-medium text-stoneDark/60 hover:text-stoneDark transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Home
        </Link>

        <Link
          href="/gallery"
          className="flex items-center gap-1.5 text-xs font-medium text-gold-700 hover:text-gold-900 transition-colors"
        >
          <ImageIcon className="w-4 h-4" />
          View All Photos
        </Link>
      </div>

      {/* If uploads are paused by couple */}
      {!config.isUploadActive ? (
        <div className="text-center py-20 px-4 glass-panel rounded-3xl border border-gold-200/80 max-w-lg mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-gold-100 flex items-center justify-center mx-auto text-gold-600">
            <Heart className="w-8 h-8 fill-gold-600/20" />
          </div>
          <h2 className="font-serif-wedding text-3xl font-medium text-stoneDark">
            Uploads Are Currently Paused
          </h2>
          <p className="font-sans text-xs sm:text-sm text-stoneDark/70 max-w-sm mx-auto">
            {config.coupleNames} have temporarily paused photo submissions. You can still browse and enjoy all the shared memories in the gallery!
          </p>
          <div className="pt-2">
            <Link
              href="/gallery"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-stoneDark text-ivory-50 text-sm font-medium hover:bg-black transition-all"
            >
              <ImageIcon className="w-4 h-4 text-gold-400" />
              Visit Photo Gallery
            </Link>
          </div>
        </div>
      ) : (
        <PhotoUploadZone
          maxFiles={config.maxFilesPerUpload}
          maxFileSizeMb={config.maxFileSizeMb}
          allowVideos={config.allowVideoUploads}
          coupleNames={config.coupleNames}
        />
      )}
    </div>
  );
}
