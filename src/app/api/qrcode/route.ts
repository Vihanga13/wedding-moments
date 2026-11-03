import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { getPublicUploadUrl } from '@/lib/qrcode';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'png';
    const download = searchParams.get('download') === 'true';
    const customUrl = searchParams.get('url');

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`;
    const uploadUrl = customUrl || getPublicUploadUrl(appUrl);

    if (format === 'svg') {
      const svgString = await QRCode.toString(uploadUrl, {
        type: 'svg',
        margin: 2,
        width: 600,
        color: {
          dark: '#1E1C1A',
          light: '#FFFFFF',
        },
      });

      return new NextResponse(svgString, {
        headers: {
          'Content-Type': 'image/svg+xml',
          ...(download
            ? { 'Content-Disposition': 'attachment; filename="wedding_upload_qrcode.svg"' }
            : {}),
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    // High resolution PNG buffer (1200x1200) for crystal-clear table signs and prints
    const pngBuffer = await QRCode.toBuffer(uploadUrl, {
      type: 'png',
      margin: 2,
      width: 1200,
      color: {
        dark: '#1E1C1A',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'H',
    });

    if (format === 'dataurl') {
      const dataUrl = `data:image/png;base64,${pngBuffer.toString('base64')}`;
      return NextResponse.json({ dataUrl, uploadUrl });
    }

    return new Response(new Uint8Array(pngBuffer), {
      headers: {
        'Content-Type': 'image/png',
        ...(download
          ? { 'Content-Disposition': 'attachment; filename="wedding_upload_qrcode.png"' }
          : {}),
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err: any) {
    console.error('Error generating QR code:', err);
    return NextResponse.json({ error: 'Failed to generate QR code' }, { status: 500 });
  }
}
