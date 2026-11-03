import {
  detectMimeType,
  validateUploadedFile,
  sanitizeFileName,
  generateUniqueStorageName,
} from '@/lib/file-validator';

describe('Guest Upload File Validation & Sanitization', () => {
  // Test JPEG magic bytes: FF D8 FF
  const validJpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
  // Test PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
  const validPngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
  // Test WebP magic bytes: RIFF .... WEBP
  const validWebpBuffer = Buffer.from([
    0x52, 0x49, 0x46, 0x46, // RIFF
    0x24, 0x00, 0x00, 0x00,
    0x57, 0x45, 0x42, 0x50, // WEBP
  ]);
  // Malicious/invalid text buffer
  const invalidBuffer = Buffer.from('<?php echo "malicious script"; ?>');

  test('correctly identifies JPEG magic bytes', () => {
    expect(detectMimeType(validJpegBuffer)).toBe('image/jpeg');
  });

  test('correctly identifies PNG magic bytes', () => {
    expect(detectMimeType(validPngBuffer)).toBe('image/png');
  });

  test('correctly identifies WebP magic bytes', () => {
    expect(detectMimeType(validWebpBuffer)).toBe('image/webp');
  });

  test('rejects non-image or executable files', () => {
    expect(detectMimeType(invalidBuffer)).toBeNull();

    const res = validateUploadedFile(invalidBuffer, 'application/x-php', 'hack.php', 10 * 1024 * 1024);
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('Invalid file type');
  });

  test('validates valid JPEG file within size limits', () => {
    const res = validateUploadedFile(validJpegBuffer, 'image/jpeg', 'wedding_reception.jpg', 10 * 1024 * 1024);
    expect(res.isValid).toBe(true);
    expect(res.detectedMime).toBe('image/jpeg');
  });

  test('rejects oversized files exceeding max bytes limit', () => {
    // 5MB max, test with 6MB buffer
    const largeBuffer = Buffer.alloc(6 * 1024 * 1024);
    largeBuffer[0] = 0xff;
    largeBuffer[1] = 0xd8;
    largeBuffer[2] = 0xff;

    const res = validateUploadedFile(largeBuffer, 'image/jpeg', 'huge_photo.jpg', 5 * 1024 * 1024);
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('exceeds maximum allowed size');
  });

  test('rejects empty 0-byte file submissions', () => {
    const emptyBuffer = Buffer.alloc(0);
    const res = validateUploadedFile(emptyBuffer, 'image/jpeg', 'empty.jpg', 10 * 1024 * 1024);
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('empty');
  });

  test('sanitizes unsafe filenames and directory traversal attempts', () => {
    const unsafeName = '../../../etc/passwd.jpg';
    const sanitized = sanitizeFileName(unsafeName);
    expect(sanitized).not.toContain('../');
    expect(sanitized).toBe('passwd.jpg');

    const specialChars = 'bride & groom <special> #1.jpeg';
    const clean = sanitizeFileName(specialChars);
    expect(clean).not.toContain('<');
    expect(clean).not.toContain('>');
    expect(clean).not.toContain(' ');
  });

  test('generates unique collision-resistant storage filenames', () => {
    const name1 = generateUniqueStorageName('first_dance.jpg');
    const name2 = generateUniqueStorageName('first_dance.jpg');
    expect(name1).toMatch(/^wedding_\d+_[a-f0-9]{8}_first_dance\.jpg$/);
    expect(name1).not.toBe(name2);
  });
});
