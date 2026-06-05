export const DOC_TYPES = [
  'Regulation', 'Directive', 'Resolution', 'Act', 'Decree',
  'Guideline', 'Policy', 'Notice', 'Circular',
];

export const ENTITIES = [
  'Ministry of Justice', 'Supreme Court', 'National Assembly', 'Federal Agency',
  'State Department', 'Regulatory Commission', 'Law Reform Commission', 'Attorney General',
];

export const CHARSETS = ['UTF-8', 'ISO-8859-1', 'Windows-1252', 'ASCII', 'UTF-16'];

export const THEME_TREE = {
  'Civil Law':          ['Contracts', 'Property', 'Torts'],
  'Criminal Law':       ['Felonies', 'Misdemeanors'],
  'Labor Law':          ['Contracts of Employment', 'Collective Bargaining', 'Workplace Safety'],
  'Administrative Law': ['Licensing', 'Public Procurement'],
};
export const THEME_NAMES = Object.keys(THEME_TREE);

export const DESC_MAX = 200;

let _uid = 100;
export const uid = () => ++_uid;
