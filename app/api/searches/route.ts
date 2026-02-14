import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function POST(request: Request) {
  const body = await request.json();
  const search = await prisma.savedSearch.create({ data: body });
  return NextResponse.json(search);
}
