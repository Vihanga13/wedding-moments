'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, SwitchCamera, AlertCircle, Sparkles } from 'lucide-react';

interface LiveCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

export default function LiveCameraModal({
  isOpen,
  onClose,
  onCapture,
}: LiveCameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [error, setError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [flash, setFlash] = useState(false);

  // Start or restart camera whenever modal is open or facingMode changes
  useEffect(() => {
    if (!isOpen) return;

    let activeStream: MediaStream | null = null;
    let isCancelled = false;

    async function startCamera() {
      setError(null);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Your browser does not support in-app camera access. Please use the Browse button.');
        return;
      }

      try {
        // Try requested facing mode with high resolution
        const constraints: MediaStreamConstraints = {
          audio: false,
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        };

        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

        if (isCancelled) {
          mediaStream.getTracks().forEach((track) => track.stop());
          return;
        }

        activeStream = mediaStream;
        setStream(mediaStream);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(() => {});
        }
      } catch (err: any) {
        console.warn('Primary camera constraints failed, trying basic video:', err);
        try {
          // Fallback to any available video stream
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: true,
          });

          if (isCancelled) {
            fallbackStream.getTracks().forEach((track) => track.stop());
            return;
          }

          activeStream = fallbackStream;
          setStream(fallbackStream);

          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
            videoRef.current.play().catch(() => {});
          }
        } catch (fallbackErr: any) {
          console.error('Camera access error:', fallbackErr);
          if (fallbackErr.name === 'NotAllowedError' || fallbackErr.name === 'PermissionDeniedError') {
            setError('Camera permission was denied. Please allow camera access in your browser settings.');
          } else {
            setError('Unable to access camera on this device. Please check your camera permissions.');
          }
        }
      }
    }

    startCamera();

    return () => {
      isCancelled = true;
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
      setStream(null);
    };
  }, [isOpen, facingMode]);

  function handleCapture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || isCapturing) return;

    setIsCapturing(true);
    setFlash(true);
    setTimeout(() => setFlash(false), 200);

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsCapturing(false);
      return;
    }

    // If using front camera, mirror image back to natural orientation
    if (facingMode === 'user') {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        setIsCapturing(false);
        if (!blob) {
          setError('Failed to capture photo frame.');
          return;
        }

        const fileName = `wedding_moment_${Date.now()}.jpg`;
        const file = new File([blob], fileName, { type: 'image/jpeg' });

        onCapture(file);
        onClose();
      },
      'image/jpeg',
      0.92
    );
  }

  function toggleCamera() {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative w-full max-w-lg bg-stone-900 border border-gold-400/40 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 bg-black/60 border-b border-white/10 z-10">
          <div className="flex items-center gap-2 text-gold-300">
            <Sparkles className="w-4 h-4 text-gold-400" />
            <span className="font-serif-wedding text-lg font-medium tracking-wide text-ivory-100">
              Capture a Wedding Moment
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Close camera"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder Window */}
        <div className="relative aspect-[3/4] sm:aspect-[4/5] bg-black flex items-center justify-center overflow-hidden">
          {error ? (
            <div className="p-6 text-center text-rose-300 space-y-3">
              <AlertCircle className="w-10 h-10 mx-auto text-rose-400" />
              <p className="text-sm font-sans">{error}</p>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 px-4 py-2 rounded-xl bg-white/10 text-xs text-white hover:bg-white/20"
              >
                Close & Use File Upload
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className={`w-full h-full object-cover transition-transform ${
                  facingMode === 'user' ? '-scale-x-100' : ''
                }`}
              />

              {/* Romantic Viewfinder Corner Accents */}
              <div className="absolute inset-4 pointer-events-none border border-gold-300/30 rounded-2xl">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-gold-400 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-gold-400 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-gold-400 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-gold-400 rounded-br-lg" />
              </div>

              {/* Shutter Flash Animation */}
              {flash && (
                <div className="absolute inset-0 bg-white z-20 pointer-events-none transition-opacity duration-200" />
              )}
            </>
          )}

          {/* Hidden Canvas for Frame Capture */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Bottom Control Deck */}
        {!error && (
          <div className="flex items-center justify-around px-6 py-6 bg-black/80 border-t border-white/10">
            {/* Flip Camera Button */}
            <button
              type="button"
              onClick={toggleCamera}
              className="p-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95 flex flex-col items-center gap-1"
              title="Flip camera"
            >
              <SwitchCamera className="w-5 h-5 text-gold-300" />
              <span className="text-[10px] text-ivory-200/80">Flip</span>
            </button>

            {/* Circular Shutter Button */}
            <button
              type="button"
              onClick={handleCapture}
              disabled={isCapturing}
              className="relative p-1 rounded-full bg-gradient-to-tr from-gold-500 via-gold-400 to-gold-300 shadow-glow hover:scale-105 active:scale-95 transition-all group disabled:opacity-50"
              aria-label="Snap photo"
            >
              <div className="w-16 h-16 rounded-full border-2 border-black/40 bg-white flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-gold-500 group-hover:bg-gold-600 transition-colors flex items-center justify-center">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </div>
            </button>

            {/* Cancel Button */}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
