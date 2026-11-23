'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  ArrowUpDown,
  RefreshCw,
  Camera,
  Heart,
  User,
  Calendar,
  Sparkles,
  AlertCircle,
  Download,
  Lock,
} from 'lucide-react';
import { PhotoData, GalleryResponse } from '@/types';
import ImageLightbox from './ImageLightbox';
import { getOrCreateUploaderToken } from '@/lib/uploader-token';

export default function GalleryGrid() {
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPhotos, setTotalPhotos] = useState(0);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [searchGuest, setSearchGuest] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Couple unlock state
  const [couplePin, setCouplePin] = useState<string>('');
  const [isCoupleUnlocked, setIsCoupleUnlocked] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // Read saved PIN or URL query parameter on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlPin = urlParams.get('pin') || urlParams.get('passcode');
      const savedPin = localStorage.getItem('wedding_couple_pin');
      const activePin = urlPin || savedPin;
      if (activePin) {
        setCouplePin(activePin);
        if (urlPin) {
          localStorage.setItem('wedding_couple_pin', urlPin);
        }
      }
    }
  }, []);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchGuest);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchGuest]);

  async function fetchPhotos() {
    setLoading(true);
    setError(null);
    try {
      const token = getOrCreateUploaderToken();
      const params = new URLSearchParams({
        page: String(page),
        limit: '24',
        sort: sortOrder,
        ...(couplePin ? { pin: couplePin } : token ? { uploaderToken: token } : {}),
        ...(debouncedSearch ? { guest: debouncedSearch } : {}),
      });

      const res = await fetch(`/api/photos?${params.toString()}`, {
        headers: token ? { 'x-uploader-token': token } : {},
      });
      if (!res.ok) throw new Error('Failed to load photos.');
      const data: GalleryResponse = await res.json();
      setPhotos(data.photos);
      setTotalPages(data.totalPages);
      setTotalPhotos(data.total);
      if (data.isCouple) {
        setIsCoupleUnlocked(true);
      } else if (couplePin) {
        setIsCoupleUnlocked(false);
        setPinError('Invalid PIN. Please try again.');
        localStorage.removeItem('wedding_couple_pin');
      }
    } catch (err: any) {
      console.error('Gallery fetch error:', err);
      setError(err.message || 'Unable to load photo gallery.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPhotos();
  }, [page, sortOrder, debouncedSearch, couplePin]);

  function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    setPinError(null);
    if (!pinInput.trim()) return;
    setCouplePin(pinInput.trim());
    localStorage.setItem('wedding_couple_pin', pinInput.trim());
    setShowPinModal(false);
    setPinInput('');
  }

  function handleLock() {
    setCouplePin('');
    setIsCoupleUnlocked(false);
    localStorage.removeItem('wedding_couple_pin');
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header & Filter Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-6 border-b border-gold-200/60">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="font-serif-wedding text-3xl sm:text-4xl text-stoneDark font-medium">
              {isCoupleUnlocked ? 'All Wedding Moments & Wishes' : 'Your Uploaded Moments'}
            </h2>
            {isCoupleUnlocked ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-sans font-medium bg-emerald-100/90 text-emerald-800 border border-emerald-300 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Couple View (All Guests)
                <button
                  type="button"
                  onClick={handleLock}
                  className="ml-1 text-emerald-700 hover:text-emerald-950 underline text-[10px]"
                  title="Lock back to device view"
                >
                  Lock
                </button>
              </span>
            ) : (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-sans font-medium bg-gold-100/80 text-gold-800 border border-gold-200/60">
                  <Lock className="w-3 h-3 text-gold-700" />
                  Private to this device
                </span>
                <button
                  type="button"
                  onClick={() => setShowPinModal(true)}
                  className="text-xs font-sans text-gold-700 hover:text-gold-900 underline font-medium"
                >
                  Couple Unlock
                </button>
              </div>
            )}
          </div>
          <p className="font-sans text-xs sm:text-sm text-stoneDark/60 mt-1">
            {isCoupleUnlocked
              ? `Viewing all ${totalPhotos} photos and wedding wishes from all guests.`
              : totalPhotos === 0
              ? 'Photos you capture and upload from this phone or browser will appear here.'
              : `You have uploaded ${totalPhotos} photo${totalPhotos === 1 ? '' : 's'} to Brunthavan & Shibaani's album.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search by guest */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-stoneDark/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchGuest}
              onChange={(e) => setSearchGuest(e.target.value)}
              placeholder="Filter by guest name..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gold-200 bg-white text-xs font-sans placeholder:text-stoneDark/40 focus:outline-none focus:ring-2 focus:ring-gold-400"
            />
          </div>

          {/* Sort toggle */}
          <button
            type="button"
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gold-200 bg-white text-xs font-medium text-stoneDark hover:bg-gold-50 transition-colors"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-gold-600" />
            <span>{sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}</span>
          </button>

          {/* Refresh button */}
          <button
            type="button"
            onClick={fetchPhotos}
            disabled={loading}
            className="p-2 rounded-xl border border-gold-200 bg-white text-stoneDark hover:bg-gold-50 transition-colors disabled:opacity-50"
            title="Refresh gallery"
          >
            <RefreshCw className={`w-4 h-4 text-gold-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
          <button
            onClick={fetchPhotos}
            className="px-4 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-medium hover:bg-rose-700"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && photos.length === 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl overflow-hidden aspect-[4/5] bg-gradient-to-tr from-gold-100/50 to-ivory-200/50 animate-pulse border border-gold-100"
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && photos.length === 0 && !error && (
        <div className="text-center py-20 px-4 glass-panel rounded-3xl border border-gold-200/60 max-w-lg mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-gold-100 flex items-center justify-center mx-auto text-gold-600">
            <Camera className="w-8 h-8" />
          </div>
          <h3 className="font-serif-wedding text-2xl font-medium text-stoneDark">
            No Photos Uploaded Yet
          </h3>
          <p className="font-sans text-xs text-stoneDark/60 max-w-sm mx-auto">
            You haven&apos;t shared any photos from this device yet. Any candid moments you snap and upload will appear here privately and save to the couple&apos;s album!
          </p>
          <div className="pt-2">
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-gold-500 to-gold-600 text-white text-sm font-medium shadow-soft hover:shadow-glow hover:brightness-105 transition-all"
            >
              <Camera className="w-4 h-4" />
              Upload Your First Photo
            </Link>
          </div>
        </div>
      )}

      {/* Photo Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              onClick={() => {
                setCurrentPhotoIndex(index);
                setLightboxOpen(true);
              }}
              className="group relative rounded-2xl overflow-hidden aspect-[4/5] bg-ivory-100 border border-gold-200/60 shadow-soft hover:shadow-card cursor-pointer transition-all duration-300 hover:-translate-y-1"
            >
              {/* Blur-up background placeholder */}
              {photo.blurDataUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photo.blurDataUrl}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover filter blur-lg scale-110 opacity-70"
                />
              )}

              {/* Main Photo Preview */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/photos/${photo.id}/preview`}
                alt={photo.guestCaption || photo.originalFileName}
                loading="lazy"
                className="relative z-10 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 select-none"
                onContextMenu={(e) => e.preventDefault()}
              />

              {/* Romantic Hover Overlay */}
              <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/75 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 flex flex-col justify-end text-white text-xs">
                {photo.guestCaption && (
                  <p className="font-serif-wedding text-base italic line-clamp-2 text-ivory-100">
                    &ldquo;{photo.guestCaption}&rdquo;
                  </p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-white/20 mt-2 text-[11px] text-ivory-200/80">
                  <span className="flex items-center gap-1 font-medium truncate">
                    <User className="w-3 h-3 text-gold-300" />
                    {photo.guestName || 'Wedding Guest'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span>
                      {new Date(photo.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <a
                      href={`/api/photos/${photo.id}/download`}
                      download={photo.originalFileName}
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 rounded-md bg-white/20 hover:bg-gold-500 text-white transition-colors"
                      title="Download photo"
                    >
                      <Download className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-xl border border-gold-200 bg-white text-xs font-medium text-stoneDark hover:bg-gold-50 disabled:opacity-40 transition-colors"
          >
            Previous
          </button>

          <span className="text-xs text-stoneDark/70 px-3">
            Page {page} of {totalPages}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-xl border border-gold-200 bg-white text-xs font-medium text-stoneDark hover:bg-gold-50 disabled:opacity-40 transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* Lightbox Modal */}
      <ImageLightbox
        photos={photos}
        currentIndex={currentPhotoIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onNavigate={(newIdx) => setCurrentPhotoIndex(newIdx)}
      />

      {/* PIN Unlock Modal for Couple */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-gold-300 space-y-4">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-full bg-gold-100 flex items-center justify-center mx-auto text-gold-700">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="font-serif-wedding text-2xl font-bold text-stoneDark">
                Couple Access
              </h3>
              <p className="text-xs font-sans text-stoneDark/60">
                Enter your wedding PIN to view all guest photos and wishes.
              </p>
            </div>

            <form onSubmit={handleUnlock} className="space-y-4">
              <div>
                <input
                  type="password"
                  autoFocus
                  placeholder="Enter PIN (e.g. 2811)"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  className="w-full px-4 py-3 text-center tracking-widest text-lg font-mono rounded-xl border border-gold-300 focus:outline-none focus:ring-2 focus:ring-gold-500 bg-ivory-50/50"
                />
                {pinError && (
                  <p className="text-xs text-rose-600 mt-1.5 text-center">{pinError}</p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPinModal(false);
                    setPinError(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-stone-200 text-xs font-medium text-stone-600 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gold-600 text-xs font-medium text-white hover:bg-gold-500 shadow-sm"
                >
                  Unlock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
