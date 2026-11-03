import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(60, Math.max(1, parseInt(searchParams.get('limit') || '24', 10)));
    const sort = searchParams.get('sort') === 'asc' ? 'asc' : 'desc';
    const guestSearch = searchParams.get('guest')?.trim();

    // Guests view approved photos in the gallery
    const where: any = {
      status: 'APPROVED',
    };

    if (guestSearch) {
      where.guestName = {
        contains: guestSearch,
      };
    }

    const [total, photos] = await Promise.all([
      prisma.photo.count({ where }),
      prisma.photo.findMany({
        where,
        orderBy: { createdAt: sort },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          originalFileName: true,
          mimeType: true,
          fileSizeBytes: true,
          width: true,
          height: true,
          blurDataUrl: true,
          guestName: true,
          guestCaption: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      photos,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error: any) {
    console.error('Error fetching gallery photos:', error);
    return NextResponse.json({ error: 'Failed to retrieve gallery photos' }, { status: 500 });
  }
}
