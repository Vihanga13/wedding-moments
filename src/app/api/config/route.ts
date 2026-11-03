import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET: Public wedding configuration
export async function GET() {
  try {
    let config = await prisma.weddingConfig.findUnique({
      where: { id: 'default' },
    });

    if (!config) {
      config = await prisma.weddingConfig.create({
        data: { id: 'default' },
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching wedding config:', error);
    return NextResponse.json({ error: 'Failed to retrieve configuration' }, { status: 500 });
  }
}
