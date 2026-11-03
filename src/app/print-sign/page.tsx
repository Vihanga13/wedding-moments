import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import PrintableTableSign from '@/components/PrintableTableSign';
import { getPublicUploadUrl } from '@/lib/qrcode';

export const dynamic = 'force-dynamic';

export default async function PrintSignPage() {
  let config = await prisma.weddingConfig.findUnique({
    where: { id: 'default' },
  });

  if (!config) {
    config = await prisma.weddingConfig.create({
      data: { id: 'default' },
    });
  }

  // Detect live host on Netlify / production so printable table sign QR always opens the live site
  const headerList = headers();
  const host = headerList.get('x-forwarded-host') || headerList.get('host');
  const proto = headerList.get('x-forwarded-proto') || 'https';
  const dynamicOrigin = host && !host.includes('localhost') ? `${proto}://${host}` : undefined;
  const uploadUrl = getPublicUploadUrl(dynamicOrigin);

  return <PrintableTableSign config={config as any} uploadUrl={uploadUrl} />;
}
