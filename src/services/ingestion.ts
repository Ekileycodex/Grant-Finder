import { prisma } from '@/src/lib/prisma';
import { extractEligibility } from './extraction';
import { jaccardSimilarity } from '@/src/lib/utils';

const userAgent = process.env.INGESTION_USER_AGENT || 'GrantFinderBot/1.0';

async function fetchJsonWithBackoff(url: string, retries = 3): Promise<any> {
  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': userAgent } });
    if (res.ok) return res.json();
    if (res.status === 429 || res.status >= 500) await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
  }
  throw new Error(`Failed to fetch ${url}`);
}

function mapGrant(source: string, item: any) {
  return {
    source,
    sourceIdentifier: String(item.id || item.opportunityId || item.opp_number || item.solicitationNumber),
    sourceUrl: item.url || item.link || item.opportunity_url || 'https://www.grants.gov/',
    title: item.title || item.opportunityTitle || item.name,
    agency: item.agency || item.agencyName || item.agency_name || null,
    subAgency: item.subAgency || item.sub_agency || null,
    program: item.program || item.programName || null,
    fundingMin: item.awardFloor ? Number(item.awardFloor) : null,
    fundingMax: item.awardCeiling ? Number(item.awardCeiling) : null,
    ceiling: item.awardCeiling ? Number(item.awardCeiling) : null,
    floor: item.awardFloor ? Number(item.awardFloor) : null,
    closeDate: item.closeDate ? new Date(item.closeDate) : null,
    openDate: item.openDate ? new Date(item.openDate) : null,
    postedDate: item.postedDate ? new Date(item.postedDate) : null,
    eligibilityTextRaw: item.eligibility || item.eligibility_text || null,
    descriptionRaw: item.description || item.synopsis || null,
    keywords: item.keywords || [],
    geography: [],
    entityTypeConstraints: [],
    costShareRequired: null,
    citizenshipRequired: null,
    usOwnedRequired: null,
    naicsConstraints: [],
    sizeConstraints: null,
    notes: null,
    extractionStatus: 'pending' as const,
    lastSeenAt: new Date()
  };
}

async function upsertDedup(mapped: ReturnType<typeof mapGrant>) {
  const existingBySource = await prisma.grantOpportunity.findUnique({
    where: { source_sourceIdentifier: { source: mapped.source, sourceIdentifier: mapped.sourceIdentifier } }
  });
  if (existingBySource) {
    return prisma.grantOpportunity.update({ where: { id: existingBySource.id }, data: { ...mapped, updatedAt: new Date() } });
  }

  const candidates = await prisma.grantOpportunity.findMany({ where: { source: mapped.source }, take: 50, orderBy: { updatedAt: 'desc' } });
  const fuzzy = candidates.find((c) => jaccardSimilarity(c.title, mapped.title) > 0.85);
  if (fuzzy) {
    return prisma.grantOpportunity.update({ where: { id: fuzzy.id }, data: { ...mapped } });
  }
  return prisma.grantOpportunity.create({ data: mapped });
}

export async function ingestGrantsGov() {
  const apiUrl = `${process.env.GRANTS_GOV_API_BASE || 'https://api.grants.gov/v1/api'}/search2`;
  try {
    const payload = await fetchJsonWithBackoff(apiUrl);
    const rows = payload.data || payload.opportunities || [];
    for (const row of rows.slice(0, 100)) await upsertDedup(mapGrant('grants.gov', row));
    return rows.length;
  } catch {
    const html = await fetch('https://www.grants.gov/search-results-detail').then((r) => r.text());
    if (html.includes('Opportunity')) {
      await upsertDedup(
        mapGrant('grants.gov', {
          id: `fallback-${Date.now()}`,
          title: 'Fallback Grants.gov Opportunity',
          description: 'HTML fallback parser placeholder',
          opportunity_url: 'https://www.grants.gov/'
        })
      );
      return 1;
    }
    return 0;
  }
}

export async function ingestSbir() {
  const apiUrl = `${process.env.SBIR_API_BASE || 'https://www.sbir.gov/api'}/solicitations.json`;
  try {
    const payload = await fetchJsonWithBackoff(apiUrl);
    const rows = payload || [];
    for (const row of rows.slice(0, 100)) await upsertDedup(mapGrant('sbir.gov', row));
    return rows.length;
  } catch {
    return 0;
  }
}

export async function runExtractionPass(limit = 25) {
  const pending = await prisma.grantOpportunity.findMany({ where: { extractionStatus: 'pending', eligibilityTextRaw: { not: null } }, take: limit });
  for (const grant of pending) {
    const result = await extractEligibility(grant.eligibilityTextRaw || '');
    if (!result.success || !result.data) {
      await prisma.grantOpportunity.update({ where: { id: grant.id }, data: { extractionStatus: 'failed', extractionFailedReason: result.error } });
      continue;
    }
    await prisma.grantOpportunity.update({
      where: { id: grant.id },
      data: {
        extractionStatus: 'done',
        entityTypeConstraints: result.data.entity_type_constraints,
        citizenshipRequired: result.data.citizenship_required === 'unknown' ? null : result.data.citizenship_required,
        usOwnedRequired: result.data.us_owned_required === 'unknown' ? null : result.data.us_owned_required,
        sizeConstraints: result.data.size_constraints === 'unknown' ? null : result.data.size_constraints,
        naicsConstraints: result.data.naics_constraints,
        geography: result.data.geography,
        costShareRequired: result.data.cost_share_required === 'unknown' ? null : result.data.cost_share_required,
        notes: JSON.stringify({ disqualifiers: result.data.disqualifiers, required_documents: result.data.required_documents })
      }
    });
  }
}
