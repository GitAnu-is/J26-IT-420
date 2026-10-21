export type UserRole =
  | 'FARMER'
  | 'AGRICULTURAL_OFFICER'
  | 'TRANSPORT_OPERATOR'
  | 'ADMIN'
  | 'farmer'
  | 'officer'
  | 'transport';

export interface User {
  id: string;
  fullName: string;
  name: string; // alias for fullName to preserve existing component references
  email: string;
  phoneNumber?: string;
  role: UserRole;
  createdAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  token?: string; // alias for accessToken
}

export interface JwtPayload {
  sub: string;
  id?: string;
  name?: string;
  fullName?: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export interface FieldError {
  field?: string;
  path?: string[];
  message: string;
  code?: string;
}

export interface ApiErrorBody {
  success?: boolean;
  message?: string;
  error?: {
    code?: string;
    details?: FieldError[];
  };
  code?: string;
  errors?: FieldError[];
}