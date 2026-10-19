import { ApiError } from './apiClient';
import type { TranslationKey } from '../data/translations/en';

// Server returns stable codes; the client maps them to translated messages.
const errorCodeKeys: Record<string, TranslationKey> = {
  INVALID_CREDENTIALS: 'errInvalidCredentials',
  EMAIL_TAKEN: 'errEmailTaken',
  DUPLICATE_EMAIL: 'errEmailTaken',
  NETWORK: 'errNetwork',
  UNAUTHORIZED: 'errSessionExpired'
};


const fieldCodeKeys: Record<string, TranslationKey> = {
  INVALID_EMAIL: 'errEmail',
  PASSWORD_TOO_SHORT: 'errPassword',
  REQUIRED: 'errName',
  INVALID_ROLE: 'errRole'
};

export function errorMessageKey(error: unknown): TranslationKey {
  if (error instanceof ApiError) return errorCodeKeys[error.code] ?? 'errorBody';
  return 'errorBody';
}

export function fieldErrorKeys(error: unknown): Record<string, TranslationKey> {
  if (!(error instanceof ApiError)) return {};
  return Object.fromEntries(
    error.fieldErrors
      .filter((f) => f && (f.field || (f.path && f.path.length > 0)))
      .map((f) => {
        const fieldName = f.field || (f.path ? f.path[0] : 'general');
        const codeKey = f.code ? fieldCodeKeys[f.code] ?? 'errRequired' : 'errRequired';
        return [fieldName, codeKey];
      })
  );
}