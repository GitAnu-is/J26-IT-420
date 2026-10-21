import type { JwtPayload, User } from '../types/auth';

// Client only DECODES the token to read the user and expiry. Signature verification happens on the Express server.
export function decodeJwt(token: string): JwtPayload | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const json = decodeURIComponent(
      atob(part.replace(/-/g, '+').replace(/_/g, '/')).
      split('').
      map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`).
      join('')
    );
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string, skewSeconds = 30): boolean {
  const payload = decodeJwt(token);
  if (!payload?.exp) return true;
  return payload.exp - skewSeconds <= Math.floor(Date.now() / 1000);
}

export function userFromToken(token: string): User | null {
  const p = decodeJwt(token);
  const fullName = p?.fullName || p?.name || '';
  return p ? { id: p.sub || p.id || '', name: fullName, fullName, email: p.email, role: p.role } : null;
}

// Used ONLY by the in-browser mock server. A real JWT is signed with a server secret.
export function createMockJwt(user: User, ttlSeconds = 8 * 60 * 60): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: JwtPayload = { sub: user.id, name: user.name, email: user.email, role: user.role, iat: now, exp: now + ttlSeconds };
  return `${base64Url({ alg: 'HS256', typ: 'JWT' })}.${base64Url(payload)}.mock-signature`;
}

function base64Url(value: object) {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  let binary = '';
  bytes.forEach((b) => binary += String.fromCharCode(b));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}