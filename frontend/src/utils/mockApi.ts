// In-browser stand-in for the Express API so the web app works without a server.
// It mirrors the real contract: same paths, status codes and error bodies.
import { createMockJwt, decodeJwt, isTokenExpired, userFromToken } from './jwt';
import type { ApiErrorBody, FieldError, User, UserRole } from '../types/auth';

interface StoredUser extends User {
  password: string;
}

export interface MockResponse {
  status: number;
  data: unknown;
}

export type MockFailure = 'none' | 'error' | 'offline';

const USERS_KEY = 'agriguard.mockUsers';
const DEMO_USER: StoredUser = {
  id: 'u_demo_farmer',
  name: 'Nimal Perera',
  fullName: 'Nimal Perera',
  email: 'farmer@agriguard.lk',
  role: 'FARMER',
  password: 'harvest123'
};
const ROLES: UserRole[] = ['FARMER', 'AGRICULTURAL_OFFICER', 'TRANSPORT_OPERATOR', 'farmer', 'officer', 'transport'];

export async function mockFetch(method: string, path: string, body: unknown, token: string | null, failure: MockFailure): Promise<MockResponse> {
  await new Promise((r) => setTimeout(r, 450));
  if (failure === 'offline') throw new TypeError('Failed to fetch');
  if (failure === 'error') return fail(500, { code: 'INTERNAL_ERROR', message: 'Internal server error' });

  const route = `${method.toUpperCase()} ${path}`;
  switch (route) {
    case 'POST /auth/login':
      return login(body as Record<string, string>);
    case 'POST /auth/register':
      return register(body as Record<string, string>);
    case 'GET /auth/me':
      return me(token);
    default:
      return fail(404, { code: 'NOT_FOUND', message: `No route for ${route}` });
  }
}

export function getDemoToken(): string {
  return createMockJwt(DEMO_USER);
}

function login(body: Record<string, string>): MockResponse {
  const errors: FieldError[] = [];
  if (!isEmail(body?.email)) errors.push({ field: 'email', code: 'INVALID_EMAIL', message: 'Invalid email' });
  if (!body?.password || body.password.length < 8) errors.push({ field: 'password', code: 'PASSWORD_TOO_SHORT', message: 'Password too short' });
  if (errors.length) return fail(422, { code: 'VALIDATION_ERROR', errors });

  const user = readUsers().find((u) => u.email === body.email.trim().toLowerCase());
  if (!user || user.password !== body.password) return fail(401, { code: 'INVALID_CREDENTIALS' });
  return ok(200, { token: createMockJwt(user), accessToken: createMockJwt(user), refreshToken: 'mock_refresh_token', user: publicUser(user) });
}

function register(body: Record<string, string>): MockResponse {
  const errors: FieldError[] = [];
  const name = body?.fullName?.trim() || body?.name?.trim();
  if (!name) errors.push({ field: 'fullName', code: 'REQUIRED', message: 'Full name is required' });
  if (!isEmail(body?.email)) errors.push({ field: 'email', code: 'INVALID_EMAIL', message: 'Invalid email' });
  if (!ROLES.includes(body?.role as UserRole)) errors.push({ field: 'role', code: 'INVALID_ROLE', message: 'Invalid role' });
  if (!body?.password || body.password.length < 8) errors.push({ field: 'password', code: 'PASSWORD_TOO_SHORT', message: 'Password too short' });
  if (errors.length) return fail(422, { code: 'VALIDATION_ERROR', errors });

  const users = readUsers();
  const email = body.email.trim().toLowerCase();
  if (users.some((u) => u.email === email)) return fail(409, { code: 'EMAIL_TAKEN' });
  const user: StoredUser = {
    id: `u_${Date.now().toString(36)}`,
    name,
    fullName: name,
    email,
    role: body.role as UserRole,
    password: body.password
  };
  writeUsers([...users, user]);
  return ok(201, { token: createMockJwt(user), accessToken: createMockJwt(user), refreshToken: 'mock_refresh_token', user: publicUser(user) });
}

function me(token: string | null): MockResponse {
  if (!token || !decodeJwt(token) || isTokenExpired(token)) return fail(401, { code: 'UNAUTHORIZED' });
  return ok(200, { user: userFromToken(token) });
}

function readUsers(): StoredUser[] {
  try {
    const raw = window.localStorage.getItem(USERS_KEY);
    const users = raw ? JSON.parse(raw) as StoredUser[] : [];
    return users.some((u) => u.email === DEMO_USER.email) ? users : [DEMO_USER, ...users];
  } catch {
    return [DEMO_USER];
  }
}

function writeUsers(users: StoredUser[]) {
  try {
    window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch {

    // ignore
  }}

const publicUser = ({ password: _password, ...u }: StoredUser): User => u;
const ok = (status: number, data: unknown): MockResponse => ({ status, data });
const fail = (status: number, data: ApiErrorBody): MockResponse => ({ status, data });
const isEmail = (v?: string) => !!v && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());