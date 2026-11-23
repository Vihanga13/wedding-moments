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

    const pin = searchParams.get('pin')?.trim() || searchParams.get('passcode')?.trim();
    const validPins = ['2811', '2026', process.env.COUPLE_PIN].filter(Boolean);
    const isCouple = !!pin && validPins.includes(pin);

    // If no uploader token is provided and not couple unlocked, return empty list to protect guest privacy
    if (!isCouple && !uploaderToken) {
      return NextResponse.json({
        photos: [],
        total: 0,
        page: 1,
        limit,
        totalPages: 0,
        isCouple: false,
      });
    }

    // Guests view only photos they uploaded from their device; couple views all photos
    const where: any = {
      status: 'APPROVED',
      ...(isCouple ? {} : { uploaderToken }),
    };

    if (guestSearch) {
      where.OR = [
        { guestName: { contains: guestSearch, mode: 'insensitive' } },
        { guestCaption: { contains: guestSearch, mode: 'insensitive' } },
      ];
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
      isCouple,
    });
  } catch (error: any) {
    console.error('Error fetching gallery photos:', error);
    return NextResponse.json({ error: 'Failed to retrieve gallery photos' }, { status: 500 });
  }
}
