import {
  generateQRCodePngDataUrl,
  generateQRCodeSvgString,
  getPublicUploadUrl,
} from '@/lib/qrcode';

describe('QR Code Generation', () => {
  const testUrl = 'https://ourweddingmoments.com/upload';

  test('formats public upload URL correctly', () => {
    expect(getPublicUploadUrl('https://wedding.example.com/')).toBe(
      'https://wedding.example.com/upload'
    );
    expect(getPublicUploadUrl('http://localhost:3000')).toBe(
      'http://localhost:3000/upload'
    );
  });

  test('generates valid PNG Data URL with correct mime header', async () => {
    const dataUrl = await generateQRCodePngDataUrl(testUrl, { width: 300 });
    expect(dataUrl.startsWith('data:image/png;base64,')).toBe(true);
    expect(dataUrl.length).toBeGreaterThan(500);
  }, 15000);

  test('generates valid scalable SVG string', async () => {
    const svg = await generateQRCodeSvgString(testUrl, { width: 300 });
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect(svg).toContain('viewBox');
  }, 15000);

  test('supports custom contrast styling and quiet zones', async () => {
    const dataUrl = await generateQRCodePngDataUrl(testUrl, {
      margin: 4,
      darkColor: '#1E1C1A',
      lightColor: '#FAF8F5',
      width: 400,
    });
    expect(dataUrl.startsWith('data:image/png;base64,')).toBe(true);
  }, 15000);
});
