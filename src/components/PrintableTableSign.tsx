'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Printer, ArrowLeft, Heart, Sparkles, Check } from 'lucide-react';
import { WeddingConfigData } from '@/types';

interface PrintableTableSignProps {
  config: WeddingConfigData;
  uploadUrl: string;
}

export default function PrintableTableSign({ config, uploadUrl }: PrintableTableSignProps) {
  const [activeUrl, setActiveUrl] = useState(uploadUrl);
  const [signSize, setSignSize] = useState<'5x7' | '4x6' | 'a4'>('5x7');
  const [customSubtitle, setCustomSubtitle] = useState(
    'Please scan with your phone camera to share all the candid photos & memories you take today!'
  );

  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.location.origin) {
      if (uploadUrl.includes('localhost') && !window.location.origin.includes('localhost')) {
        setActiveUrl(`${window.location.origin}/upload`);
      } else {
        setActiveUrl(uploadUrl);
      }
    }
  }, [uploadUrl]);

  return (
    <div className="min-h-screen bg-stone-100 p-4 sm:p-8 flex flex-col items-center justify-center font-sans">
      {/* Control Toolbar (Hidden in print) */}
      <div className="no-print max-w-2xl w-full mb-8 p-4 rounded-2xl glass-panel shadow-card border border-gold-200/80 flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-medium text-stoneDark/70 hover:text-stoneDark"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Size Selector */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-stoneDark/60">Template:</span>
          {(['5x7', '4x6', 'a4'] as const).map((size) => (
            <button
              key={size}
              onClick={() => setSignSize(size)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                signSize === size
                  ? 'bg-gold-500 text-white border-gold-500 shadow-sm'
                  : 'bg-white text-stoneDark border-gold-200 hover:bg-gold-50'
              }`}
            >
              {size === '5x7' ? '5" x 7" (Table Tent)' : size === '4x6' ? '4" x 6"' : 'A4 / Letter'}
            </button>
          ))}
        </div>

        {/* Print Button */}
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-5 py-2 rounded-xl bg-stoneDark text-ivory-50 text-xs font-semibold hover:bg-black shadow-md transition-all"
        >
          <Printer className="w-4 h-4 text-gold-400" />
          Print Sign
        </button>
      </div>

      {/* Printable Card */}
      <div
        className={`print-page bg-white shadow-2xl transition-all duration-300 flex flex-col items-center justify-between text-center relative border border-gold-300/60 p-8 sm:p-12 ${
          signSize === '5x7'
            ? 'w-[420px] min-h-[588px]'
            : signSize === '4x6'
            ? 'w-[360px] min-h-[540px]'
            : 'w-[595px] min-h-[842px]'
        }`}
      >
        {/* Double Gold Border */}
        <div className="absolute inset-3 border border-gold-400/50 pointer-events-none rounded-sm" />
        <div className="absolute inset-4 border-2 border-gold-400/80 pointer-events-none rounded-sm" />

        {/* Top Header */}
        <div className="relative z-10 space-y-2 pt-2">
          <div className="w-8 h-8 rounded-full border border-gold-400 mx-auto flex items-center justify-center">
            <Heart className="w-4 h-4 text-gold-600 fill-gold-400/20" />
          </div>
          <h1 className="font-script-wedding text-4xl sm:text-5xl text-stoneDark font-normal">
            {config.coupleNames || 'Sarah & Michael'}
          </h1>
          <p className="font-serif-wedding text-xs sm:text-sm tracking-widest uppercase text-gold-700 font-medium">
            {config.weddingDate || 'October 24, 2026'}
          </p>
          {config.venue && (
            <p className="font-sans text-[11px] text-stoneDark/50 tracking-wide uppercase">
              {config.venue}
            </p>
          )}
        </div>

        {/* QR Code Section */}
        <div className="relative z-10 my-4 flex flex-col items-center space-y-3">
          <div className="p-3 bg-white border border-gold-300 rounded-xl shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/qrcode?format=png&url=${encodeURIComponent(activeUrl)}`}
              alt="QR Code"
              className="w-44 h-44 sm:w-52 sm:h-52 object-contain"
            />
          </div>

          <div className="space-y-1">
            <h2 className="font-serif-wedding text-xl sm:text-2xl font-semibold text-stoneDark">
              Share Your Photos With Us
            </h2>
            <p className="font-sans text-xs text-stoneDark/70 max-w-[280px] sm:max-w-xs mx-auto leading-relaxed">
              {customSubtitle}
            </p>
          </div>
        </div>

        {/* Footer instructions */}
        <div className="relative z-10 pb-2 space-y-1">
          <p className="font-sans text-[10px] tracking-wider uppercase text-gold-700 font-semibold">
            Point your camera &bull; Tap the link &bull; No app needed
          </p>
          <p className="font-sans text-[9px] text-stoneDark/40">
            {activeUrl}
          </p>
        </div>
      </div>
    </div>
  );
}
