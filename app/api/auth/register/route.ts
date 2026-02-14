import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/src/lib/prisma';

export async function POST(request: Request) {
  const body = await request.json();
  if (!body.email || !body.password || body.password.length < 8) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(body.password, 12);
  try {
    const user = await prisma.user.create({ data: { email: body.email.toLowerCase(), passwordHash } });
    return NextResponse.json({ id: user.id });
  } catch {
    return NextResponse.json({ error: 'User creation failed' }, { status: 400 });
  }
}
