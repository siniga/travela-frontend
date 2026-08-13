export type LegalBlock =
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'note'; title: string; text: string };

export type LegalSection = {
  number: string;
  title: string;
  blocks: LegalBlock[];
};

export type LegalDocument = {
  slug: 'terms' | 'privacy';
  title: string;
  effectiveDate: string;
  intro: string[];
  sections: LegalSection[];
  contact: {
    company: string;
    email: string;
    website: string;
    extra?: string;
  };
};
