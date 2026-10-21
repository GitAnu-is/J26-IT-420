import { apiRequest } from './client';
import { AuthResponse, User, UserRole } from '../types/auth';

export const authApi = {
  login: (email: string, password: string) =>
    apiRequest<AuthResponse>('POST', '/auth/login', { email, password }),

  register: (input: { fullName: string; email: string; role: UserRole; password: string; phoneNumber?: string }) =>
    apiRequest<AuthResponse>('POST', '/auth/register', input),

  refresh: (refreshToken: string) =>
    apiRequest<{ accessToken: string; refreshToken: string }>('POST', '/auth/refresh', { refreshToken }),

  logout: (refreshToken: string) =>
    apiRequest<{ message: string }>('POST', '/auth/logout', { refreshToken }),

  logoutAll: () =>
    apiRequest<{ message: string }>('POST', '/auth/logout-all'),

  me: () =>
    apiRequest<{ user: User } | User>('GET', '/auth/me').then((res) => {
      // Normalizes envelope if wrapped under { user: ... } or returned directly
      if ('user' in res) {
        return { user: { ...res.user, name: res.user.fullName || (res.user as any).name } };
      }
      return { user: { ...res, name: (res as any).fullName || (res as any).name } };
    }),

  updateProfile: (data: { fullName?: string; phoneNumber?: string }) =>
    apiRequest<{ user: User }>('PATCH', '/users/me', data),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiRequest<{ message: string }>('POST', '/auth/change-password', { currentPassword, newPassword })
};
