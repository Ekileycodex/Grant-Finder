// MVP architecture choice: keep Node API routes in Next.js to share TS models/services with UI and worker.
import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.toLowerCase();
  const grants = await prisma.grantOpportunity.findMany({
    where: q
      ? {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { descriptionRaw: { contains: q, mode: 'insensitive' } }
          ]
        }
      : undefined,
    take: 50,
    orderBy: [{ closeDate: 'asc' }, { updatedAt: 'desc' }]
  });
  return NextResponse.json(grants);
}
