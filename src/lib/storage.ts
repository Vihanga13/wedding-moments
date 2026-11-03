import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import os from 'os';
import sharp from 'sharp';
import { Readable } from 'stream';
import {
  isGoogleDriveConfigured,
  uploadToGoogleDrive,
  getFileStreamFromGoogleDrive,
  deleteFromGoogleDrive,
} from './google-drive';

// In serverless environments (Netlify, Vercel, AWS Lambda), process.cwd() is read-only.
// We use the OS temporary directory for Sharp preview caching and fallback storage.
const isServerless = !!(
  process.env.NETLIFY ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.VERCEL ||
  process.env.NODE_ENV === 'production' && !process.env.LOCAL_DEV
);

const LOCAL_DATA_DIR = isServerless
  ? path.join(os.tmpdir(), 'wedding-moments-data')
  : path.join(process.cwd(), '.data');

const LOCAL_ORIGINALS_DIR = path.join(LOCAL_DATA_DIR, 'originals');
const LOCAL_PREVIEWS_DIR = path.join(LOCAL_DATA_DIR, 'previews');

// Ensure local storage directories exist
function ensureDirectories() {
  if (!fsSync.existsSync(LOCAL_DATA_DIR)) {
    fsSync.mkdirSync(LOCAL_DATA_DIR, { recursive: true });
  }
  if (!fsSync.existsSync(LOCAL_ORIGINALS_DIR)) {
    fsSync.mkdirSync(LOCAL_ORIGINALS_DIR, { recursive: true });
  }
  if (!fsSync.existsSync(LOCAL_PREVIEWS_DIR)) {
    fsSync.mkdirSync(LOCAL_PREVIEWS_DIR, { recursive: true });
  }
}

export interface StoredFileResult {
  provider: 'google_drive' | 'local';
  driveFileId?: string;
  storageKey: string;
  width?: number;
  height?: number;
  blurDataUrl?: string;
}

export async function storeOriginalFile(
  buffer: Buffer,
  sanitizedFileName: string,
  mimeType: string,
  photoId: string
): Promise<StoredFileResult> {
  ensureDirectories();

  // Generate metadata and tiny blur placeholder using Sharp for images
  let width: number | undefined;
  let height: number | undefined;
  let blurDataUrl: string | undefined;

  const isImage = mimeType.startsWith('image/');
  if (isImage) {
    try {
      const image = sharp(buffer);
      const meta = await image.metadata();
      width = meta.width;
      height = meta.height;

      // Create a tiny 16px blur placeholder base64
      const blurBuffer = await sharp(buffer)
        .resize(16, 16, { fit: 'inside' })
        .webp({ quality: 20 })
        .toBuffer();
      blurDataUrl = `data:image/webp;base64,${blurBuffer.toString('base64')}`;

      // Also create and cache an optimized web preview (max width 1600px)
      const previewBuffer = await sharp(buffer)
        .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer();

      const previewPath = path.join(LOCAL_PREVIEWS_DIR, `${photoId}.webp`);
      await fs.writeFile(previewPath, previewBuffer);
    } catch (err) {
      console.warn('Sharp image processing warning:', err);
    }
  }

  // Check if Google Drive is available
  const driveReady = isGoogleDriveConfigured();

  if (driveReady) {
    try {
      const driveRes = await uploadToGoogleDrive(sanitizedFileName, mimeType, buffer);
      return {
        provider: 'google_drive',
        driveFileId: driveRes.fileId,
        storageKey: driveRes.fileId,
        width,
        height,
        blurDataUrl,
      };
    } catch (driveErr) {
      console.error('Google Drive upload failed, checking local fallback:', driveErr);
      const fallbackAllowed = process.env.ENABLE_LOCAL_STORAGE_FALLBACK === 'true';
      if (!fallbackAllowed) {
        throw new Error(`Google Drive upload failed: ${(driveErr as Error).message}`);
      }
    }
  }

  // Local storage fallback
  const localFileName = `${photoId}_${sanitizedFileName}`;
  const filePath = path.join(LOCAL_ORIGINALS_DIR, localFileName);
  await fs.writeFile(filePath, buffer);

  return {
    provider: 'local',
    storageKey: localFileName,
    width,
    height,
    blurDataUrl,
  };
}

export async function getOriginalStream(
  storageProvider: string,
  storageKey: string,
  googleDriveFileId?: string | null,
  mimeType?: string
): Promise<{
  stream: NodeJS.ReadableStream;
  mimeType: string;
  size?: number;
}> {
  ensureDirectories();

  if (storageProvider === 'google_drive' && googleDriveFileId) {
    const driveRes = await getFileStreamFromGoogleDrive(googleDriveFileId);
    return {
      stream: driveRes.stream,
      mimeType: driveRes.mimeType || mimeType || 'application/octet-stream',
      size: driveRes.fileSize,
    };
  }

  // Local file
  const localPath = path.join(LOCAL_ORIGINALS_DIR, storageKey);
  if (!fsSync.existsSync(localPath)) {
    throw new Error('Original file not found in local storage.');
  }

  const stat = await fs.stat(localPath);
  const stream = fsSync.createReadStream(localPath);

  return {
    stream,
    mimeType: mimeType || 'application/octet-stream',
    size: stat.size,
  };
}

export async function getPreviewBuffer(
  photoId: string,
  storageProvider: string,
  storageKey: string,
  googleDriveFileId?: string | null,
  originalMime?: string
): Promise<{ buffer: Buffer; mimeType: string }> {
  ensureDirectories();

  const previewPath = path.join(LOCAL_PREVIEWS_DIR, `${photoId}.webp`);

  // If preview already exists on disk, return it
  if (fsSync.existsSync(previewPath)) {
    const buffer = await fs.readFile(previewPath);
    return { buffer, mimeType: 'image/webp' };
  }

  // Otherwise, get original and generate preview
  let originalBuffer: Buffer;

  if (storageProvider === 'google_drive' && googleDriveFileId) {
    const { stream } = await getFileStreamFromGoogleDrive(googleDriveFileId);
    originalBuffer = await streamToBuffer(stream);
  } else {
    const localPath = path.join(LOCAL_ORIGINALS_DIR, storageKey);
    if (!fsSync.existsSync(localPath)) {
      throw new Error('Photo source not found to generate preview.');
    }
    originalBuffer = await fs.readFile(localPath);
  }

  if (originalMime && !originalMime.startsWith('image/')) {
    // If it's a video, return the raw buffer or placeholder
    return { buffer: originalBuffer, mimeType: originalMime };
  }

  // Generate webp preview
  const preview = await sharp(originalBuffer)
    .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();

  // Save for future fast serving
  try {
    await fs.writeFile(previewPath, preview);
  } catch (err) {
    console.warn('Could not cache preview to disk:', err);
  }

  return { buffer: preview, mimeType: 'image/webp' };
}

export async function deleteStoredFile(
  storageProvider: string,
  storageKey: string,
  googleDriveFileId?: string | null,
  photoId?: string
): Promise<void> {
  ensureDirectories();

  // Clean preview cache
  if (photoId) {
    const previewPath = path.join(LOCAL_PREVIEWS_DIR, `${photoId}.webp`);
    if (fsSync.existsSync(previewPath)) {
      try {
        await fs.unlink(previewPath);
      } catch (e) {}
    }
  }

  // Clean original
  if (storageProvider === 'google_drive' && googleDriveFileId) {
    try {
      await deleteFromGoogleDrive(googleDriveFileId);
    } catch (err) {
      console.warn('Failed to delete file from Google Drive:', err);
    }
  }

  if (storageKey) {
    const localPath = path.join(LOCAL_ORIGINALS_DIR, storageKey);
    if (fsSync.existsSync(localPath)) {
      try {
        await fs.unlink(localPath);
      } catch (e) {}
    }
  }
}

export async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('error', (err) => reject(err));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}
