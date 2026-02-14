import { describe, expect, it } from 'vitest';
import { evaluateEligibility } from '@/src/services/eligibility';

const baseGrant = {
  geography: ['US'],
  entityTypeConstraints: ['small business', 'llc'],
  citizenshipRequired: null,
  usOwnedRequired: true,
  naicsConstraints: ['541715']
};

const profile = {
  entity_type: 'LLC' as const,
  location: 'CA',
  employees: 10,
  revenue_band: '$1M',
  is_us_owned: true,
  has_prior_federal_funding: false,
  naics_codes: ['541715'],
  trl_level: 5
};

describe('eligibility engine', () => {
  it('returns likely eligible when one field is unknown', () => {
    const res = evaluateEligibility(baseGrant, profile);
    expect(res.verdict).toBe('LIKELY_ELIGIBLE');
  });

  it('returns not eligible on deterministic failure', () => {
    const res = evaluateEligibility({ ...baseGrant, usOwnedRequired: true }, { ...profile, is_us_owned: false });
    expect(res.verdict).toBe('NOT_ELIGIBLE');
  });
});
