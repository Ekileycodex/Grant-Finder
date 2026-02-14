import { z } from 'zod';
import OpenAI from 'openai';
import type { ExtractionOutput } from '@/src/lib/types';

const extractionSchema = z.object({
  entity_type_constraints: z.array(z.string()),
  citizenship_required: z.union([z.boolean(), z.literal('unknown')]),
  us_owned_required: z.union([z.boolean(), z.literal('unknown')]),
  size_constraints: z.union([z.string(), z.literal('unknown')]),
  naics_constraints: z.array(z.string()),
  geography: z.array(z.string()),
  cost_share_required: z.union([z.boolean(), z.literal('unknown')]),
  disqualifiers: z.array(z.string()),
  required_documents: z.array(z.string())
});

const client = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

function buildPrompt(text: string, strict = false) {
  return `${strict ? 'STRICT MODE: output only valid JSON.' : ''}
Extract structured eligibility rules from the solicitation text.
Return JSON with these exact keys and types.
Unknown booleans must be \"unknown\".
Text:\n${text}`;
}

export async function extractEligibility(text: string): Promise<{ success: boolean; data?: ExtractionOutput; error?: string }> {
  if (!client) return { success: false, error: 'OpenAI key not configured' };

  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0,
      input: [
        {
          role: 'system',
          content:
            'You are a strict extractor. Never infer missing values. Return only JSON and no markdown. If unknown, use the allowed unknown sentinel.'
        },
        { role: 'user', content: buildPrompt(text, attempt === 1) }
      ]
    });

    const raw = response.output_text?.trim();
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw);
      const validated = extractionSchema.parse(parsed);
      return { success: true, data: validated };
    } catch {
      if (attempt === 1) return { success: false, error: 'Validation failed after retry' };
    }
  }

  return { success: false, error: 'Empty model output' };
}

export { extractionSchema };
