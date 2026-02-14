import Link from 'next/link';
import { prisma } from '@/src/lib/prisma';

export default async function DashboardPage() {
  const grants = await prisma.grantOpportunity.findMany({ take: 20, orderBy: [{ closeDate: 'asc' }, { updatedAt: 'desc' }] });
  const savedSearches = await prisma.savedSearch.findMany({ take: 10, orderBy: { createdAt: 'desc' } });

  return (
    <div className="space-y-6">
      <section className="card">
        <h2 className="font-semibold mb-3">Saved searches</h2>
        <ul className="space-y-2 text-sm">
          {savedSearches.map((s) => (
            <li key={s.id} className="flex justify-between"><span>{s.name}</span><span>{s.keywords.join(', ')}</span></li>
          ))}
        </ul>
      </section>
      <section className="card">
        <h2 className="font-semibold mb-3">Latest opportunities</h2>
        <ul className="space-y-2">
          {grants.map((g) => (
            <li key={g.id} className="border-b pb-2">
              <Link href={`/grants/${g.id}`} className="font-medium">{g.title}</Link>
              <p className="text-sm text-slate-600">{g.agency || 'Unknown agency'} · closes {g.closeDate?.toISOString().slice(0, 10) || 'TBD'}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
