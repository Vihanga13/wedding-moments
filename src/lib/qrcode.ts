import QRCode from 'qrcode';

export interface QRCodeOptions {
  width?: number;
  margin?: number;
  darkColor?: string;
  lightColor?: string;
}

export function getPublicUploadUrl(baseUrl?: string): string {
  const origin = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const cleanOrigin = origin.replace(/\/$/, '');
  return `${cleanOrigin}/upload`;
}

export async function generateQRCodePngDataUrl(
  text: string,
  options?: QRCodeOptions
): Promise<string> {
  const defaultOptions: QRCode.QRCodeToDataURLOptions = {
    errorCorrectionLevel: 'H', // High error correction allows wedding monogram/logo in center or slight wear and tear
    type: 'image/png',
    margin: options?.margin ?? 2,
    width: options?.width ?? 600,
    color: {
      dark: options?.darkColor ?? '#1E1C1A', // Deep charcoal/espresso for crisp contrast
      light: options?.lightColor ?? '#FFFFFF',
    },
  };

  return await QRCode.toDataURL(text, defaultOptions);
}

export async function generateQRCodeSvgString(
  text: string,
  options?: QRCodeOptions
): Promise<string> {
  const defaultOptions: QRCode.QRCodeToStringOptions = {
    errorCorrectionLevel: 'H',
    type: 'svg',
    margin: options?.margin ?? 2,
    width: options?.width ?? 600,
    color: {
      dark: options?.darkColor ?? '#1E1C1A',
      light: options?.lightColor ?? '#FFFFFF',
    },
  };

  return await QRCode.toString(text, defaultOptions);
}
