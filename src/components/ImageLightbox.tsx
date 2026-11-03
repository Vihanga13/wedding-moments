'use client';

import { useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, User, Calendar, MessageSquareHeart, Download } from 'lucide-react';
import { PhotoData } from '@/types';

interface ImageLightboxProps {
  photos: PhotoData[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export default function ImageLightbox({
  photos,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
}: ImageLightboxProps) {
  const currentPhoto = photos[currentIndex];

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && currentIndex > 0) onNavigate(currentIndex - 1);
      if (e.key === 'ArrowRight' && currentIndex < photos.length - 1) onNavigate(currentIndex + 1);
    },
    [isOpen, currentIndex, photos.length, onClose, onNavigate]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen || !currentPhoto) return null;

  const formattedDate = new Date(currentPhoto.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div
      className="fixed inset-0 z-50 bg-stoneDark/95 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 animate-fade-in"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        aria-label="Close image viewer"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Navigation - Prev */}
      {currentIndex > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(currentIndex - 1);
          }}
          className="absolute left-3 sm:left-6 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          aria-label="Previous photo"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Navigation - Next */}
      {currentIndex < photos.length - 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(currentIndex + 1);
          }}
          className="absolute right-3 sm:right-6 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          aria-label="Next photo"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Main Image Container */}
      <div
        className="relative max-w-5xl max-h-[90vh] w-full flex flex-col items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-black/40 flex items-center justify-center max-h-[75vh]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/photos/${currentPhoto.id}/preview`}
            alt={currentPhoto.originalFileName || 'Wedding memory'}
            className="max-h-[75vh] max-w-full object-contain select-none"
          />
        </div>

        {/* Caption, Metadata & Download Bar */}
        <div className="w-full max-w-2xl mt-4 px-4 py-3 rounded-xl bg-white/10 backdrop-blur-md text-ivory-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            {currentPhoto.guestName && (
              <span className="flex items-center gap-1.5 font-medium text-gold-300">
                <User className="w-3.5 h-3.5" />
                {currentPhoto.guestName}
              </span>
            )}
            <span className="flex items-center gap-1 text-ivory-200/60">
              <Calendar className="w-3.5 h-3.5" />
              {formattedDate}
            </span>
          </div>

          {currentPhoto.guestCaption && (
            <p className="flex items-center gap-1.5 text-ivory-100 italic truncate max-w-sm">
              <MessageSquareHeart className="w-3.5 h-3.5 text-blush-300 flex-shrink-0" />
              &ldquo;{currentPhoto.guestCaption}&rdquo;
            </p>
          )}

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-ivory-200/50">
              {currentIndex + 1} of {photos.length}
            </span>

            {/* Direct download button for guests and couple */}
            <a
              href={`/api/photos/${currentPhoto.id}/download`}
              download={currentPhoto.originalFileName}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gold-500 hover:bg-gold-600 text-white font-medium text-xs shadow-sm transition-all"
              title="Download photo"
              onClick={(e) => e.stopPropagation()}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
