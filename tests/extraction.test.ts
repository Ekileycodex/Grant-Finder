import { describe, expect, it } from 'vitest';
import { extractionSchema } from '@/src/services/extraction';

describe('extraction schema', () => {
  it('accepts valid payload', () => {
    const parsed = extractionSchema.parse({
      entity_type_constraints: ['LLC'],
      citizenship_required: 'unknown',
      us_owned_required: true,
      size_constraints: 'under 500 employees',
      naics_constraints: ['541715'],
      geography: ['US'],
      cost_share_required: false,
      disqualifiers: ['foreign ownership'],
      required_documents: ['sam registration']
    });
    expect(parsed.naics_constraints[0]).toBe('541715');
  });

  it('rejects invalid payload', () => {
    expect(() => extractionSchema.parse({ entity_type_constraints: [] })).toThrow();
  });
});
