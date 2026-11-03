import crypto from 'crypto';

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  detectedMime?: string;
}

// Magic bytes checks for image & video formats
export function detectMimeType(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;

  // JPEG / JPG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }

  // WebP: RIFF .... WEBP
  // buffer[0..3] = "RIFF", buffer[8..11] = "WEBP"
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'image/webp';
  }

  // HEIC / AVIF (ftyp)
  const ftypBrand = buffer.toString('utf8', 4, 12);
  if (ftypBrand.includes('heic') || ftypBrand.includes('heix') || ftypBrand.includes('mif1')) {
    return 'image/heic';
  }
  if (ftypBrand.includes('avif') || ftypBrand.includes('avis')) {
    return 'image/avif';
  }

  // MP4 video (ftypisom, ftypmp42, etc.)
  if (ftypBrand.includes('isom') || ftypBrand.includes('mp4') || ftypBrand.includes('MSNV')) {
    return 'video/mp4';
  }

  return null;
}

export function validateUploadedFile(
  buffer: Buffer,
  declaredMimeType: string,
  fileName: string,
  maxSizeBytes: number,
  allowVideos: boolean = false
): FileValidationResult {
  // Check size
  if (buffer.length === 0) {
    return { isValid: false, error: 'File is empty.' };
  }
  if (buffer.length > maxSizeBytes) {
    const maxMb = Math.round(maxSizeBytes / (1024 * 1024));
    return {
      isValid: false,
      error: `File exceeds maximum allowed size of ${maxMb}MB.`,
    };
  }

  // Detect genuine mime type from buffer content
  const detected = detectMimeType(buffer);
  const allowedImageMimes = ['image/jpeg', 'image/png', 'image/webp'];
  const allowedVideoMimes = ['video/mp4'];

  const allowedMimes = allowVideos
    ? [...allowedImageMimes, ...allowedVideoMimes]
    : allowedImageMimes;

  // If detected mime matches allowed
  if (detected && allowedMimes.includes(detected)) {
    return { isValid: true, detectedMime: detected };
  }

  // Fallback check if declared mime is in allowed list and buffer isn't obviously corrupt
  if (allowedMimes.includes(declaredMimeType) && detected === null) {
    return { isValid: true, detectedMime: declaredMimeType };
  }

  return {
    isValid: false,
    error: `Invalid file type. Allowed formats: JPEG, PNG, WebP${allowVideos ? ', MP4' : ''}.`,
    detectedMime: detected || declaredMimeType,
  };
}

export function sanitizeFileName(originalName: string): string {
  // Remove directory traversal characters and non-alphanumeric except dots/dashes
  const basename = originalName.replace(/^.*[\\/]/, '');
  const clean = basename.replace(/[^a-zA-Z0-9._-]/g, '_');
  // Ensure non-empty
  return clean || 'photo.jpg';
}

export function generateUniqueStorageName(originalName: string): string {
  const sanitized = sanitizeFileName(originalName);
  const ext = sanitized.lastIndexOf('.') > 0 ? sanitized.substring(sanitized.lastIndexOf('.')) : '.jpg';
  const timestamp = Date.now();
  const randomSuffix = crypto.randomBytes(4).toString('hex');
  const baseWithoutExt = sanitized.substring(0, sanitized.lastIndexOf('.')) || 'photo';
  const cleanBase = baseWithoutExt.slice(0, 30);
  return `wedding_${timestamp}_${randomSuffix}_${cleanBase}${ext}`;
}

export function computeFileHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}
