export type UserProfileInput = {
  entity_type: 'Individual' | 'LLC' | 'C-Corp' | 'Nonprofit';
  location: string;
  employees: number;
  revenue_band: string;
  is_us_owned: boolean;
  has_prior_federal_funding: boolean;
  naics_codes: string[];
  trl_level: number;
};

export type ExtractionOutput = {
  entity_type_constraints: string[];
  citizenship_required: boolean | 'unknown';
  us_owned_required: boolean | 'unknown';
  size_constraints: string | 'unknown';
  naics_constraints: string[];
  geography: string[];
  cost_share_required: boolean | 'unknown';
  disqualifiers: string[];
  required_documents: string[];
};
