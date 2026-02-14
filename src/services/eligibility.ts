import type { UserProfileInput } from '@/src/lib/types';

export type EligibilityVerdict = 'ELIGIBLE' | 'LIKELY_ELIGIBLE' | 'REQUIRES_CLARIFICATION' | 'NOT_ELIGIBLE';

type GrantEligibilityShape = {
  entityTypeConstraints: string[];
  usOwnedRequired: boolean | null;
  citizenshipRequired: boolean | null;
  naicsConstraints: string[];
  geography: string[];
};

type Result = {
  verdict: EligibilityVerdict;
  explanation: string;
  checklist: string[];
  missingFields: string[];
};

const mapEntityType = (s: UserProfileInput['entity_type']) => {
  if (s === 'C-Corp') return 'c-corp';
  return s.toLowerCase();
};

export function evaluateEligibility(grant: GrantEligibilityShape, profile: UserProfileInput): Result {
  const checklist: string[] = [];
  const missingFields: string[] = [];
  let blockers = 0;
  let uncertain = 0;

  if (grant.entityTypeConstraints.length) {
    const userType = mapEntityType(profile.entity_type);
    const ok = grant.entityTypeConstraints.map((x) => x.toLowerCase()).some((c) => c.includes(userType) || c.includes('small business'));
    checklist.push(`Entity type required: ${grant.entityTypeConstraints.join(', ')}`);
    if (!ok) blockers++;
  } else {
    missingFields.push('entity_type_constraints');
    uncertain++;
  }

  if (grant.usOwnedRequired === true) {
    checklist.push('Must be US owned');
    if (!profile.is_us_owned) blockers++;
  } else if (grant.usOwnedRequired === null) {
    missingFields.push('us_owned_required');
    uncertain++;
  }

  if (grant.citizenshipRequired === true) {
    checklist.push('US citizenship required');
  } else if (grant.citizenshipRequired === null) {
    missingFields.push('citizenship_required');
    uncertain++;
  }

  if (grant.naicsConstraints.length > 0) {
    checklist.push(`NAICS constraints: ${grant.naicsConstraints.join(', ')}`);
    const match = profile.naics_codes.some((code) => grant.naicsConstraints.includes(code));
    if (!match) blockers++;
  }

  if (grant.geography.length > 0) {
    checklist.push(`Geography allowed: ${grant.geography.join(', ')}`);
    const allowed = grant.geography.includes('US') || grant.geography.includes(profile.location);
    if (!allowed) blockers++;
  }

  if (blockers > 0) {
    return { verdict: 'NOT_ELIGIBLE', explanation: 'One or more deterministic constraints are not satisfied.', checklist, missingFields };
  }
  if (uncertain >= 2) {
    return {
      verdict: 'REQUIRES_CLARIFICATION',
      explanation: `Conservative decision due to missing structured fields: ${missingFields.join(', ')}`,
      checklist,
      missingFields
    };
  }
  if (uncertain === 1) {
    return { verdict: 'LIKELY_ELIGIBLE', explanation: 'All known constraints pass, but one field needs confirmation.', checklist, missingFields };
  }
  return { verdict: 'ELIGIBLE', explanation: 'All deterministic eligibility checks passed.', checklist, missingFields };
}
