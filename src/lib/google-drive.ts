import { google } from 'googleapis';
import { Readable } from 'stream';

// Scopes: drive.file provides the least-privilege access needed
export const DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
];

export function cleanEnvVal(val?: string): string {
  if (!val) return '';
  let clean = val.trim();
  if ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith("'") && clean.endsWith("'"))) {
    clean = clean.slice(1, -1).trim();
  }
  return clean;
}

export function cleanFolderId(rawId?: string): string | undefined {
  if (!rawId) return undefined;
  const trimmed = cleanEnvVal(rawId);
  const match = trimmed.match(/folders\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  return trimmed || undefined;
}

export function isGoogleDriveConfigured(): boolean {
  const clientId = cleanEnvVal(process.env.GOOGLE_CLIENT_ID);
  const clientSecret = cleanEnvVal(process.env.GOOGLE_CLIENT_SECRET);
  const refreshToken = cleanEnvVal(process.env.GOOGLE_REFRESH_TOKEN);
  const folderId = cleanFolderId(process.env.GOOGLE_DRIVE_FOLDER_ID);

  return !!(
    clientId &&
    clientSecret &&
    refreshToken &&
    folderId &&
    !clientId.includes('your_google') &&
    !folderId.includes('your_google')
  );
}

export function getOAuth2Client() {
  const clientId = cleanEnvVal(process.env.GOOGLE_CLIENT_ID);
  const clientSecret = cleanEnvVal(process.env.GOOGLE_CLIENT_SECRET);

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth Client ID and Secret must be configured in environment variables.');
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);

  const refreshToken = cleanEnvVal(process.env.GOOGLE_REFRESH_TOKEN);
  if (refreshToken) {
    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });
  }

  return oauth2Client;
}

export async function uploadToGoogleDrive(
  fileName: string,
  mimeType: string,
  buffer: Buffer,
  folderIdOverride?: string
): Promise<{ fileId: string; webViewLink?: string; size: number }> {
  const oauth2Client = getOAuth2Client();
  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  const rawFolderId = folderIdOverride || process.env.GOOGLE_DRIVE_FOLDER_ID;
  const targetFolderId = cleanFolderId(rawFolderId);
  if (!targetFolderId) {
    throw new Error('GOOGLE_DRIVE_FOLDER_ID is not configured in environment variables.');
  }

  const fileStream = new Readable();
  fileStream.push(buffer);
  fileStream.push(null);

  const response = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [targetFolderId],
    },
    media: {
      mimeType,
      body: fileStream,
    },
    fields: 'id, name, webViewLink, size',
  });

  const fileId = response.data.id;
  if (!fileId) {
    throw new Error('Failed to retrieve file ID from Google Drive response.');
  }

  return {
    fileId,
    webViewLink: response.data.webViewLink || undefined,
    size: response.data.size ? parseInt(response.data.size, 10) : buffer.length,
  };
}

export async function getFileStreamFromGoogleDrive(fileId: string): Promise<{
  stream: NodeJS.ReadableStream;
  mimeType: string;
  fileName: string;
  fileSize?: number;
}> {
  const oauth2Client = getOAuth2Client();
  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  // Fetch metadata first
  const meta = await drive.files.get({
    fileId,
    fields: 'id, name, mimeType, size',
  });

  const fileName = meta.data.name || 'wedding_photo';
  const mimeType = meta.data.mimeType || 'application/octet-stream';
  const fileSize = meta.data.size ? parseInt(meta.data.size, 10) : undefined;

  const res = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'stream' }
  );

  return {
    stream: res.data as unknown as NodeJS.ReadableStream,
    mimeType,
    fileName,
    fileSize,
  };
}

export async function deleteFromGoogleDrive(fileId: string): Promise<boolean> {
  const oauth2Client = getOAuth2Client();
  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  await drive.files.delete({
    fileId,
  });

  return true;
}
