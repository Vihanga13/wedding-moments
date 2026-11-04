'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import {
  UploadCloud,
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Sparkles,
  Heart,
  Eye,
} from 'lucide-react';
import { UploadApiResponse } from '@/types';

interface FilePreviewItem {
  id: string;
  file: File;
  previewUrl: string;
  sizeFormatted: string;
  error?: string;
  isUploading?: boolean;
  isSuccess?: boolean;
}

interface PhotoUploadZoneProps {
  maxFiles?: number;
  maxFileSizeMb?: number;
  allowVideos?: boolean;
  coupleNames?: string;
}

export default function PhotoUploadZone({
  maxFiles = 10,
  maxFileSizeMb = 25,
  allowVideos = true,
  coupleNames = 'Brunthavan & Shibaani Surudisya',
}: PhotoUploadZoneProps) {
  const [selectedFiles, setSelectedFiles] = useState<FilePreviewItem[]>([]);
  const [guestName, setGuestName] = useState('');
  const [guestCaption, setGuestCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResponse, setUploadResponse] = useState<UploadApiResponse | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  function handleFiles(files: FileList | null) {
    if (!files) return;
    setGeneralError(null);

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      ...(allowVideos ? ['video/mp4', 'video/quicktime'] : []),
    ];

    const currentCount = selectedFiles.length;
    const remainingSlots = maxFiles - currentCount;

    if (remainingSlots <= 0) {
      setGeneralError(`You have already selected the maximum of ${maxFiles} photos.`);
      return;
    }

    const filesToAdd = Array.from(files).slice(0, remainingSlots);

    const newPreviewItems: FilePreviewItem[] = [];

    filesToAdd.forEach((file) => {
      // Check duplicate in current selection
      const exists = selectedFiles.some(
        (item) => item.file.name === file.name && item.file.size === file.size
      );
      if (exists) return;

      let fileError: string | undefined;

      if (!allowedTypes.includes(file.type) && !file.name.match(/\.(jpe?g|png|webp|mp4|mov)$/i)) {
        fileError = 'Invalid format. JPEG, PNG, and WebP only.';
      } else if (file.size > maxFileSizeMb * 1024 * 1024) {
        fileError = `Exceeds ${maxFileSizeMb}MB limit.`;
      }

      newPreviewItems.push({
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
        file,
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
        sizeFormatted: formatBytes(file.size),
        error: fileError,
      });
    });

    setSelectedFiles((prev) => [...prev, ...newPreviewItems]);
  }

  function removeFile(id: string) {
    setSelectedFiles((prev) => {
      const filtered = prev.filter((item) => item.id !== id);
      const toRemove = prev.find((item) => item.id === id);
      if (toRemove && toRemove.previewUrl) {
        URL.revokeObjectURL(toRemove.previewUrl);
      }
      return filtered;
    });
  }

  function clearAll() {
    selectedFiles.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
    setSelectedFiles([]);
    setUploadResponse(null);
    setGeneralError(null);
    setUploadProgress(0);
  }

  // Client-side image optimization to prevent Netlify 6MB body limit & timeouts
  async function compressImage(file: File): Promise<File> {
    if (!file.type.startsWith('image/') || file.size < 1024 * 1024) {
      return file;
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const MAX_DIM = 2400;
          let width = img.width;
          let height = img.height;

          if (width > MAX_DIM || height > MAX_DIM) {
            if (width > height) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            } else {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(file);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (!blob || blob.size >= file.size) {
                resolve(file);
              } else {
                const safeName = file.name.replace(/\.[^.]+$/, '.jpg');
                const compressed = new File([blob], safeName, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressed);
              }
            },
            'image/jpeg',
            0.85
          );
        };
        img.onerror = () => resolve(file);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    });
  }

  async function handleUpload() {
    const validFiles = selectedFiles.filter((item) => !item.error);

    if (validFiles.length === 0) {
      setGeneralError('Please add at least one valid photo before uploading.');
      return;
    }

    setIsUploading(true);
    setGeneralError(null);
    setUploadProgress(10);

    const allUploadedResults: any[] = [];
    let totalSuccess = 0;
    let totalFailed = 0;

    for (let i = 0; i < validFiles.length; i++) {
      const item = validFiles[i];
      try {
        const fileToUpload = await compressImage(item.file);
        const formData = new FormData();
        formData.append('files', fileToUpload);

        if (guestName.trim()) {
          formData.append('guestName', guestName.trim());
        }
        if (guestCaption.trim()) {
          formData.append('guestCaption', guestCaption.trim());
        }

        const res = await fetch('/api/photos/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (res.ok && data.successCount > 0) {
          totalSuccess += data.successCount;
          allUploadedResults.push(...data.uploaded);
        } else {
          totalFailed++;
          allUploadedResults.push({
            id: '',
            originalFileName: item.file.name,
            fileSizeBytes: item.file.size,
            status: 'failed',
            error: data.uploaded?.[0]?.error || data.error || 'Failed to upload photo',
          });
        }
      } catch (err: any) {
        totalFailed++;
        allUploadedResults.push({
          id: '',
          originalFileName: item.file.name,
          fileSizeBytes: item.file.size,
          status: 'failed',
          error: err.message || 'Upload error',
        });
      }

      setUploadProgress(Math.round(((i + 1) / validFiles.length) * 90));
    }

    setUploadProgress(100);

    const finalResponse = {
      success: totalSuccess > 0,
      message:
        totalSuccess > 0
          ? `Successfully uploaded ${totalSuccess} photo${totalSuccess === 1 ? '' : 's'}!`
          : 'Failed to upload photos.',
      uploaded: allUploadedResults,
      successCount: totalSuccess,
      failedCount: totalFailed,
    };

    setUploadResponse(finalResponse);

    if (totalSuccess > 0) {
      // Trigger romantic confetti celebration!
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#D1B77B', '#EFC2C7', '#FAF8F5', '#BE9F58'],
      });
    } else {
      setGeneralError(allUploadedResults[0]?.error || 'Failed to upload photos. Please try again.');
    }

    setIsUploading(false);
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8 animate-fade-in">
      {/* Success Notification Box */}
      {uploadResponse && uploadResponse.successCount > 0 && (
        <div className="p-6 rounded-2xl glass-panel-gold border-2 border-gold-300 shadow-glow text-center space-y-4 animate-fade-up">
          <div className="w-16 h-16 rounded-full bg-gold-100 flex items-center justify-center mx-auto text-gold-600 shadow-sm">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <div>
            <h3 className="font-serif-wedding text-3xl font-semibold text-stoneDark">
              Thank You so Much!
            </h3>
            <p className="font-sans text-sm text-stoneDark/80 mt-1 max-w-md mx-auto">
              Your {uploadResponse.successCount} photo{uploadResponse.successCount === 1 ? '' : 's'} have been
              securely saved to {coupleNames}&apos;s wedding album.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/gallery"
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-stoneDark text-ivory-50 text-sm font-medium hover:bg-black transition-all shadow-md"
            >
              <Eye className="w-4 h-4 text-gold-400" />
              View Gallery
            </Link>

            <button
              onClick={clearAll}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white border border-gold-300 text-stoneDark text-sm font-medium hover:bg-gold-50 transition-all"
            >
              <Sparkles className="w-4 h-4 text-gold-600" />
              Share More Photos
            </button>
          </div>
        </div>
      )}

      {/* Main Upload Card */}
      {(!uploadResponse || uploadResponse.successCount === 0) && (
        <div className="glass-panel p-6 sm:p-10 rounded-3xl shadow-card border border-gold-200/80 space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-100/60 text-gold-700 text-xs font-sans tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              Direct to Private Drive
            </div>
            <h2 className="font-serif-wedding text-3xl sm:text-4xl text-stoneDark font-medium">
              Share Your Wedding Snaps
            </h2>
            <p className="font-sans text-sm text-stoneDark/70 max-w-md mx-auto">
              No app download or account required. Upload candid moments directly from your phone camera or gallery.
            </p>
          </div>

          {/* Upload Dropzone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFiles(e.dataTransfer.files);
            }}
            className="border-2 border-dashed border-gold-300/80 hover:border-gold-500 rounded-2xl p-8 sm:p-12 text-center bg-ivory-50/60 hover:bg-gold-50/30 transition-all cursor-pointer group flex flex-col items-center justify-center space-y-4"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-gold-100 to-blush-100 flex items-center justify-center text-gold-700 group-hover:scale-110 transition-transform shadow-soft">
              <UploadCloud className="w-8 h-8" />
            </div>

            <div>
              <p className="font-serif-wedding text-xl text-stoneDark font-medium">
                Tap or drag photos here to upload
              </p>
              <p className="font-sans text-xs text-stoneDark/60 mt-1">
                JPEG, PNG, WebP up to {maxFileSizeMb}MB each (max {maxFiles} at once)
              </p>
            </div>

            {/* Mobile Action Buttons */}
            <div
              className="flex items-center gap-3 pt-2"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gold-200 text-xs font-medium text-stoneDark hover:bg-gold-50 shadow-sm transition-all"
              >
                <ImageIcon className="w-4 h-4 text-gold-600" />
                Browse Files
              </button>

              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gold-50 border border-gold-300 text-xs font-medium text-gold-800 hover:bg-gold-100 shadow-sm transition-all"
              >
                <Camera className="w-4 h-4 text-gold-600" />
                Take Photo
              </button>
            </div>

            {/* Hidden file inputs */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />

            {/* Dedicated phone camera input with capture attribute */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>

          {/* Error Message */}
          {generalError && (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm animate-fade-in">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{generalError}</span>
            </div>
          )}

          {/* Selected File Previews */}
          {selectedFiles.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-stoneDark/70 px-1 font-medium">
                <span>
                  Selected Photos ({selectedFiles.length} of {maxFiles})
                </span>
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-rose-600 hover:underline"
                >
                  Clear all
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {selectedFiles.map((item) => (
                  <div
                    key={item.id}
                    className={`relative rounded-xl overflow-hidden aspect-square border ${
                      item.error ? 'border-rose-300 bg-rose-50' : 'border-gold-200 bg-stone-100'
                    } group shadow-sm`}
                  >
                    {item.previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.previewUrl}
                        alt={item.file.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center">
                        <ImageIcon className="w-8 h-8 text-stoneDark/40 mb-1" />
                        <span className="text-[10px] text-stoneDark/60 truncate max-w-full">
                          {item.file.name}
                        </span>
                      </div>
                    )}

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => removeFile(item.id)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-rose-600 transition-colors"
                      title="Remove"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>

                    {/* Bottom overlay with file size or error */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-1.5 text-[10px] text-white flex justify-between items-end">
                      <span className="truncate">{item.sizeFormatted}</span>
                      {item.error && (
                        <span className="text-rose-300 font-semibold truncate">
                          {item.error}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Optional Guest Name & Caption */}
          <div className="space-y-4 pt-2 border-t border-gold-200/50">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-stoneDark/80 mb-1.5">
                  Your Name (Optional)
                </label>
                <input
                  type="text"
                  maxLength={50}
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="e.g., Aunt Linda & Uncle Bob"
                  className="w-full px-4 py-2.5 rounded-xl border border-gold-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-gold-400 text-sm placeholder:text-stoneDark/30"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stoneDark/80 mb-1.5">
                  Sweet Wishes / Caption (Optional)
                </label>
                <input
                  type="text"
                  maxLength={250}
                  value={guestCaption}
                  onChange={(e) => setGuestCaption(e.target.value)}
                  placeholder="e.g., Beautiful first dance! Congratulations!"
                  className="w-full px-4 py-2.5 rounded-xl border border-gold-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-gold-400 text-sm placeholder:text-stoneDark/30"
                />
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {isUploading && (
            <div className="space-y-2 animate-fade-in">
              <div className="flex justify-between text-xs font-medium text-stoneDark/70">
                <span className="flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-gold-600" />
                  Preserving your memories...
                </span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-gold-100 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-gold-400 to-gold-600 transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="button"
            onClick={handleUpload}
            disabled={isUploading || selectedFiles.length === 0}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-gold-500 via-gold-600 to-gold-500 text-white font-serif-wedding text-xl tracking-wide font-medium shadow-card hover:shadow-glow hover:brightness-105 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Uploading Photos...
              </>
            ) : (
              <>
                <Heart className="w-5 h-5 fill-white/20" />
                Upload {selectedFiles.length > 0 ? `${selectedFiles.length} Photos` : 'Photos'}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
