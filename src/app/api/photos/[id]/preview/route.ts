import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPreviewBuffer } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const photoId = params.id;
    if (!photoId) {
      return new NextResponse('Photo ID required', { status: 400 });
    }

    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
    });

    if (!photo || photo.status !== 'APPROVED') {
      return new NextResponse('Photo not found', { status: 404 });
    }

    const { buffer, mimeType } = await getPreviewBuffer(
      photo.id,
      photo.storageProvider,
      photo.storageKey || photo.sanitizedFileName,
      photo.googleDriveFileId,
      photo.mimeType
    );

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Length': String(buffer.length),
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error: any) {
    console.error('Error generating photo preview:', error);
    return new NextResponse('Failed to render photo preview', { status: 500 });
  }
}
