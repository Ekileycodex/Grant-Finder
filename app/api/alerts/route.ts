import { NextResponse } from 'next/server';
import { sendDailyAlerts } from '@/src/services/alerts';

export async function POST() {
  await sendDailyAlerts();
  return NextResponse.json({ ok: true });
}
