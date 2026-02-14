import type { GrantOpportunity } from '@prisma/client';
import type { UserProfileInput } from '@/src/lib/types';
import { normalize } from '@/src/lib/utils';

export function scoreGrantFit(
  grant: GrantOpportunity,
  profile: UserProfileInput,
  options: { keywords: string[]; minAward?: number; maxAward?: number; agencyPreference?: string[] }
) {
  const { keywords, minAward, maxAward, agencyPreference = [] } = options;

  const text = normalize(`${grant.title} ${grant.descriptionRaw ?? ''} ${grant.keywords.join(' ')}`);
  const keywordHits = keywords.filter((k) => text.includes(normalize(k))).length;
  const keywordScore = Math.min(40, Math.round((keywordHits / Math.max(keywords.length, 1)) * 40));

  const trlTarget = grant.program?.match(/TRL\s?(\d)/i)?.[1] ? Number(grant.program?.match(/TRL\s?(\d)/i)?.[1]) : 5;
  const trlDiff = Math.abs(profile.trl_level - trlTarget);
  const trlScore = Math.max(0, 20 - trlDiff * 3);

  const grantMin = grant.fundingMin ?? grant.floor ?? 0;
  const grantMax = grant.fundingMax ?? grant.ceiling ?? grantMin;
  const overlap = minAward != null && maxAward != null ? Math.max(0, Math.min(grantMax, maxAward) - Math.max(grantMin, minAward)) : grantMax - grantMin;
  const desiredSpan = minAward != null && maxAward != null ? Math.max(1, maxAward - minAward) : Math.max(1, grantMax - grantMin);
  const fundingScore = Math.min(20, Math.round((overlap / desiredSpan) * 20));

  const geoScore = grant.geography.length === 0 || grant.geography.includes('US') || grant.geography.includes(profile.location) ? 10 : 0;
  const agencyScore = agencyPreference.length === 0 || (grant.agency && agencyPreference.includes(grant.agency)) ? 10 : 0;

  const total = Math.max(0, Math.min(100, keywordScore + trlScore + fundingScore + geoScore + agencyScore));
  return {
    total,
    breakdown: { keywordScore, trlScore, fundingScore, geographyScore: geoScore, agencyScore }
  };
}
