import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOriginalStream } from '@/lib/storage';
import { Readable } from 'stream';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const photoId = params.id;
    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
    });

    if (!photo || photo.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    // Check wedding download configuration
    const config = await prisma.weddingConfig.findUnique({
      where: { id: 'default' },
    });

    const isGuestDownloadAllowed = config ? (config as any).allowGuestDownloads !== false : true;
    if (!isGuestDownloadAllowed) {
      return NextResponse.json(
        { error: 'Guest downloads are currently disabled.' },
        { status: 403 }
      );
    }

    const { stream, mimeType, size } = await getOriginalStream(
      photo.storageProvider,
      photo.storageKey || photo.sanitizedFileName,
      photo.googleDriveFileId,
      photo.mimeType
    );

    // Convert Node Readable to Web ReadableStream for modern streaming response
    const webStream = Readable.toWeb(stream as any);

    const headers: Record<string, string> = {
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(photo.originalFileName)}"`,
      'Cache-Control': 'public, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
    };

    if (size) {
      headers['Content-Length'] = String(size);
    }

    return new Response(webStream as any, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error('Error downloading photo:', error);
    return NextResponse.json({ error: 'Failed to stream photo.' }, { status: 500 });
  }
}
