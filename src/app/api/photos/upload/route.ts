import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter';
import {
  validateUploadedFile,
  generateUniqueStorageName,
  sanitizeFileName,
  computeFileHash,
} from '@/lib/file-validator';
import { storeOriginalFile } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 1. Abuse Protection & Rate Limiting
    const clientIp = getClientIp(req.headers);
    const maxPerMin = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS_PER_MINUTE || '20', 10);
    const rateCheck = checkRateLimit(clientIp, maxPerMin);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Too many upload requests. Please wait ${rateCheck.resetSeconds} seconds before trying again.`,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(rateCheck.resetSeconds) },
        }
      );
    }

    // 2. Check Wedding Upload Status & Limits
    const config = await prisma.weddingConfig.findUnique({
      where: { id: 'default' },
    });

    if (config && !config.isUploadActive) {
      return NextResponse.json(
        { error: 'Photo uploads are currently paused by the wedding hosts.' },
        { status: 403 }
      );
    }

    const maxFiles = config?.maxFilesPerUpload || 10;
    const maxFileSizeMb = config?.maxFileSizeMb || 25;
    const maxFileSizeBytes = maxFileSizeMb * 1024 * 1024;
    const allowVideos = config?.allowVideoUploads || false;

    // 3. Parse Multipart Form
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];
    const guestName = (formData.get('guestName') as string | null)?.slice(0, 50)?.trim() || null;
    const guestCaption = (formData.get('guestCaption') as string | null)?.slice(0, 300)?.trim() || null;

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files were uploaded.' }, { status: 400 });
    }

    if (files.length > maxFiles) {
      return NextResponse.json(
        { error: `You can upload at most ${maxFiles} photos at once.` },
        { status: 400 }
      );
    }

    const results = [];
    let successCount = 0;
    let failedCount = 0;

    for (const file of files) {
      const originalFileName = file.name || 'wedding_photo.jpg';

      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Server-side magic bytes validation & size limit
        const validation = validateUploadedFile(
          buffer,
          file.type,
          originalFileName,
          maxFileSizeBytes,
          allowVideos
        );

        if (!validation.isValid) {
          failedCount++;
          results.push({
            id: '',
            originalFileName,
            fileSizeBytes: buffer.length,
            status: 'failed' as const,
            error: validation.error || 'Validation failed',
          });
          continue;
        }

        const mimeType = validation.detectedMime || file.type || 'image/jpeg';
        const sanitized = sanitizeFileName(originalFileName);
        const storageFileName = generateUniqueStorageName(sanitized);

        // Pre-create database entry to get a unique cuid photo ID
        const photo = await prisma.photo.create({
          data: {
            originalFileName: sanitized,
            sanitizedFileName: storageFileName,
            mimeType,
            fileSizeBytes: buffer.length,
            guestName,
            guestCaption,
            storageProvider: 'local', // updated below
            status: 'APPROVED',
          },
        });

        // Store original to Google Drive or local fallback with Sharp preview generation
        const stored = await storeOriginalFile(buffer, storageFileName, mimeType, photo.id);

        // Update photo record with dimensions, blur URL, and Drive file ID
        await prisma.photo.update({
          where: { id: photo.id },
          data: {
            googleDriveFileId: stored.driveFileId || null,
            storageProvider: stored.provider,
            storageKey: stored.storageKey,
            width: stored.width || null,
            height: stored.height || null,
            blurDataUrl: stored.blurDataUrl || null,
          },
        });

        successCount++;
        results.push({
          id: photo.id,
          originalFileName,
          fileSizeBytes: buffer.length,
          status: 'success' as const,
        });
      } catch (fileErr: any) {
        console.error(`Error processing file ${originalFileName}:`, fileErr);
        failedCount++;
        results.push({
          id: '',
          originalFileName,
          fileSizeBytes: 0,
          status: 'failed' as const,
          error: fileErr.message || 'Server error while storing photo',
        });
      }
    }

    return NextResponse.json({
      success: successCount > 0,
      message:
        successCount > 0
          ? `Successfully uploaded ${successCount} photo${successCount === 1 ? '' : 's'}!`
          : 'Failed to upload photos.',
      uploaded: results,
      successCount,
      failedCount,
    });
  } catch (err: any) {
    console.error('Fatal upload error:', err);
    return NextResponse.json({ error: err.message || 'Internal server upload error.' }, { status: 500 });
  }
}
