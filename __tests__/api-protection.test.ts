import { NextRequest } from 'next/server';
import { GET as downloadOriginalHandler } from '@/app/api/photos/[id]/download/route';
import { GET as previewPhotoHandler } from '@/app/api/photos/[id]/preview/route';
import { GET as weddingConfigHandler } from '@/app/api/config/route';

describe('API Route Protection and Behavior', () => {
  test('returns 404 when downloading non-existent photo', async () => {
    const req = new NextRequest('http://localhost:3000/api/photos/non-existent-id/download', {
      method: 'GET',
    });

    const response = await downloadOriginalHandler(req, {
      params: { id: 'non-existent-id' },
    });

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toContain('not found');
  });

  test('returns 404 when requesting preview of non-existent photo', async () => {
    const req = new NextRequest('http://localhost:3000/api/photos/non-existent-id/preview', {
      method: 'GET',
    });

    const response = await previewPhotoHandler(req, {
      params: { id: 'non-existent-id' },
    });

    expect(response.status).toBe(404);
  });

  test('returns public wedding config successfully for guests', async () => {
    const response = await weddingConfigHandler();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.weddingTitle).toBeDefined();
    expect(body.coupleNames).toBeDefined();
  });
});
