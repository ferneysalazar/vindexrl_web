// src/pages/admin/documents/mockData.js

const ENTITIES = [
  'Ministry of Justice', 'Supreme Court', 'National Assembly',
  'Federal Agency', 'State Department', 'Regulatory Commission',
  'Law Reform Commission', 'Attorney General', 'Civil Court', 'District Authority',
];

const PREFIXES = [
  'Regulation on', 'Directive for', 'Resolution concerning', 'Act relating to',
  'Guidelines on', 'Decree establishing', 'Framework for', 'Policy document on',
  'Notice regarding', 'Circular on',
];

const SUBJECTS = [
  'administrative procedures and public service delivery standards',
  'civil litigation and court proceedings management',
  'employment contracts and labor dispute resolution mechanisms',
  'environmental compliance and regulatory enforcement protocols',
  'corporate governance and shareholder rights protection',
  'intellectual property registration and licensing procedures',
  'criminal justice reform and rehabilitation programs',
  'family law amendments and domestic relations court rules',
  'real estate transactions and property registration requirements',
  'tax compliance obligations and audit procedures for legal entities',
  'data protection and privacy rights in legal proceedings',
  'international arbitration and cross-border dispute resolution',
  'constitutional rights enforcement and judicial review standards',
  'legal aid services and access to justice initiatives',
  'anti-corruption measures and public sector accountability',
];

export const DOCUMENTS = Array.from({ length: 87 }, (_, i) => ({
  id:     i + 1,
  name:   `${PREFIXES[i % PREFIXES.length]} ${SUBJECTS[i % SUBJECTS.length]}`,
  year:   2018 + (i % 7),
  entity: ENTITIES[i % ENTITIES.length],
  themes: 1 + (i % 8),
}));

export const ALL_YEARS    = [...new Set(DOCUMENTS.map(d => d.year))].sort((a, b) => b - a);
export const ALL_ENTITIES = [...new Set(DOCUMENTS.map(d => d.entity))].sort();

export const ROWS_PER_PAGE = 20;
