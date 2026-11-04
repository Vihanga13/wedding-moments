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
    const uploaderToken =
      searchParams.get('uploaderToken')?.trim() ||
      req.headers.get('x-uploader-token')?.trim();

    // If no uploader token is provided, return empty list to protect guest privacy
    if (!uploaderToken) {
      return NextResponse.json({
        photos: [],
        total: 0,
        page: 1,
        limit,
        totalPages: 0,
      });
    }

    // Guests view only photos they uploaded from their device
    const where: any = {
      status: 'APPROVED',
      uploaderToken,
    };

    if (guestSearch) {
      where.guestName = {
        contains: guestSearch,
        mode: 'insensitive',
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
