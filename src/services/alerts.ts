import nodemailer from 'nodemailer';
import { addDays, isBefore, startOfDay } from 'date-fns';
import { prisma } from '@/src/lib/prisma';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 1025),
  secure: false,
  auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
});

export async function sendDailyAlerts() {
  const users = await prisma.user.findMany({ include: { watchlist: { include: { grant: true } } } });
  for (const user of users) {
    const upcoming = user.watchlist.filter((w) => {
      if (!w.grant.closeDate) return false;
      const c = startOfDay(w.grant.closeDate);
      return isBefore(c, addDays(startOfDay(new Date()), 8));
    });

    if (upcoming.length === 0) continue;

    const lines = upcoming.map((w) => `- ${w.grant.title} closes ${w.grant.closeDate?.toISOString().slice(0, 10)}`).join('\n');
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: user.email,
      subject: 'GrantFinder daily digest',
      text: `Upcoming deadlines (7/3/1 day windows):\n${lines}`
    });

    await prisma.alertLog.create({ data: { userId: user.id, type: 'daily_digest', payload: { count: upcoming.length } } });
  }
}
