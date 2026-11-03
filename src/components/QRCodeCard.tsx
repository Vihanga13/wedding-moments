'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { QrCode, Download, Copy, Check, Printer, ExternalLink, Sparkles } from 'lucide-react';

interface QRCodeCardProps {
  uploadUrl?: string;
  coupleNames?: string;
}

export default function QRCodeCard({
  uploadUrl = 'http://localhost:3000/upload',
  coupleNames = 'Brunthavan & Shibaani Surudisya',
}: QRCodeCardProps) {
  const [activeUrl, setActiveUrl] = useState(uploadUrl);
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.location.origin) {
      if (uploadUrl.includes('localhost') && !window.location.origin.includes('localhost')) {
        setActiveUrl(`${window.location.origin}/upload`);
      } else {
        setActiveUrl(uploadUrl);
      }
    }
  }, [uploadUrl]);

  function copyUrl() {
    navigator.clipboard.writeText(activeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-gold-200/80 shadow-card flex flex-col items-center text-center space-y-6">
      {/* Title */}
      <div className="space-y-1">
        <span className="text-[11px] font-sans font-semibold tracking-widest uppercase text-gold-600">
          Instant Guest Access
        </span>
        <h3 className="font-serif-wedding text-2xl font-medium text-stoneDark">
          Wedding QR Code
        </h3>
        <p className="font-sans text-xs text-stoneDark/60 max-w-xs">
          Guests simply scan this code with their camera to immediately upload photos.
        </p>
      </div>

      {/* QR Code Container with gold framed border */}
      <div className="p-4 rounded-2xl bg-white border-2 border-gold-200 shadow-soft group hover:shadow-glow transition-all">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/qrcode?format=png&url=${encodeURIComponent(activeUrl)}`}
          alt="Wedding Photo Upload QR Code"
          className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-lg"
        />
        <div className="mt-2 text-[10px] tracking-wider uppercase text-gold-700/70 font-sans font-medium">
          Scan to Share Photos
        </div>
      </div>

      {/* Upload Link & Copy */}
      <div className="w-full max-w-sm flex items-center gap-2 p-2 rounded-xl bg-ivory-100/80 border border-gold-200/70 text-xs text-stoneDark/70 font-mono">
        <span className="truncate flex-1 text-left px-2 select-all">{activeUrl}</span>
        <button
          onClick={copyUrl}
          className="px-3 py-1.5 rounded-lg bg-white border border-gold-200 text-stoneDark hover:bg-gold-50 flex items-center gap-1 font-sans text-xs font-medium transition-colors shadow-sm"
          title="Copy upload link"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3 w-full">
        <a
          href={`/api/qrcode?format=png&download=true&url=${encodeURIComponent(activeUrl)}`}
          download="wedding_upload_qrcode.png"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-gold-300 text-stoneDark text-xs font-medium hover:bg-gold-50 transition-colors shadow-sm"
        >
          <Download className="w-3.5 h-3.5 text-gold-600" />
          Download PNG
        </a>

        <a
          href={`/api/qrcode?format=svg&download=true&url=${encodeURIComponent(activeUrl)}`}
          download="wedding_upload_qrcode.svg"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-gold-300 text-stoneDark text-xs font-medium hover:bg-gold-50 transition-colors shadow-sm"
        >
          <Download className="w-3.5 h-3.5 text-gold-600" />
          Download SVG
        </a>

        <Link
          href="/print-sign"
          target="_blank"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stoneDark text-white text-xs font-medium hover:bg-black transition-colors shadow-sm"
        >
          <Printer className="w-3.5 h-3.5 text-gold-400" />
          Print Table Sign
        </Link>
      </div>
    </div>
  );
}
