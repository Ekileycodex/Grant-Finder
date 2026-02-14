import { notFound } from 'next/navigation';
import { prisma } from '@/src/lib/prisma';
import { evaluateEligibility } from '@/src/services/eligibility';
import { scoreGrantFit } from '@/src/services/scoring';

const demoProfile = {
  entity_type: 'LLC' as const,
  location: 'CA',
  employees: 15,
  revenue_band: '$1M-$5M',
  is_us_owned: true,
  has_prior_federal_funding: false,
  naics_codes: ['541715'],
  trl_level: 5
};

export default async function GrantDetail({ params }: { params: { id: string } }) {
  const grant = await prisma.grantOpportunity.findUnique({ where: { id: params.id } });
  if (!grant) return notFound();

  const eligibility = evaluateEligibility(grant, demoProfile);
  const score = scoreGrantFit(grant, demoProfile, { keywords: ['ai', 'climate', 'defense'], minAward: 100000, maxAward: 500000 });

  return (
    <div className="space-y-4">
      <div className="card">
        <h1 className="text-2xl font-bold">{grant.title}</h1>
        <p className="text-sm text-slate-600">{grant.source} · {grant.agency}</p>
        <p className="mt-2">{grant.descriptionRaw}</p>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="font-semibold">Eligibility verdict</h2>
          <p className="text-lg">{eligibility.verdict}</p>
          <p className="text-sm text-slate-600">{eligibility.explanation}</p>
          <ul className="list-disc ml-5 mt-2 text-sm">{eligibility.checklist.map((c) => <li key={c}>{c}</li>)}</ul>
        </div>
        <div className="card">
          <h2 className="font-semibold">Fit score: {score.total}/100</h2>
          <pre className="text-sm">{JSON.stringify(score.breakdown, null, 2)}</pre>
        </div>
      </div>
      <div className="card">
        <h2 className="font-semibold">Raw eligibility text</h2>
        <p className="whitespace-pre-wrap text-sm">{grant.eligibilityTextRaw || 'N/A'}</p>
      </div>
    </div>
  );
}
