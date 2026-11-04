import { NextResponse } from 'next/server';
import { isGoogleDriveConfigured } from '@/lib/google-drive';

export const dynamic = 'force-dynamic';

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN || '';
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || '';

  return NextResponse.json({
    hasClientId: Boolean(clientId),
    clientIdPrefix: clientId.slice(0, 15) + '...',
    hasClientSecret: Boolean(clientSecret),
    hasRefreshToken: Boolean(refreshToken),
    refreshTokenPrefix: refreshToken.slice(0, 8) + '...',
    hasFolderId: Boolean(folderId),
    folderId,
    isGoogleDriveConfigured: isGoogleDriveConfigured(),
    enableLocalStorageFallback: process.env.ENABLE_LOCAL_STORAGE_FALLBACK,
  });
}
