import type { TranslationKey } from '../data/translations/en';
import type { UserRole } from '../types/auth';

export function initials(name?: string) {
  if (!name) return '';
  return name.
  trim().
  split(/\s+/).
  slice(0, 2).
  map((p) => p[0]?.toUpperCase() ?? '').
  join('');
}

export type NormalizedRole = 'FARMER' | 'AGRICULTURAL_OFFICER' | 'TRANSPORT_OPERATOR';

export function getNormalizedRole(role?: string): NormalizedRole {
  if (!role) return 'FARMER';
  const r = role.toUpperCase();
  if (r.includes('OFFICER') || r === 'OFFICER') return 'AGRICULTURAL_OFFICER';
  if (r.includes('TRANSPORT') || r === 'TRANSPORT' || r.includes('LOGISTIC')) return 'TRANSPORT_OPERATOR';
  return 'FARMER';
}

export function roleKey(role?: UserRole): TranslationKey {
  const norm = getNormalizedRole(role);
  if (norm === 'AGRICULTURAL_OFFICER') return 'roleOfficer';
  if (norm === 'TRANSPORT_OPERATOR') return 'roleTransport';
  return 'roleFarmer';
}