import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function POST(request: Request) {
  const body = await request.json();
  const row = await prisma.watchlistGrant.create({ data: { userId: body.userId, grantId: body.grantId } });
  return NextResponse.json(row);
}
