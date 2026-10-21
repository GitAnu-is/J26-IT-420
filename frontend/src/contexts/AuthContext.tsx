import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../utils/authApi';
import { ApiError, UNAUTHORIZED_EVENT } from '../utils/apiClient';
import { isTokenExpired, userFromToken } from '../utils/jwt';
import { tokenStorage } from '../utils/tokenStorage';
import type { User, UserRole } from '../types/auth';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  sessionExpired: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { fullName?: string; name?: string; email: string; role: UserRole; password: string; phoneNumber?: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function initialUser(): User | null {
  const token = tokenStorage.get();
  if (!token || isTokenExpired(token)) {
    if (token) tokenStorage.clear();
    return null;
  }
  return userFromToken(token);
}

export function AuthProvider({ children }: {children: React.ReactNode;}) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [sessionExpired, setSessionExpired] = useState(false);

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
  }, []);

  // Server rejected the token (expired / revoked) → end session and tell the user why.
  useEffect(() => {
    const onUnauthorized = () => {
      logout();
      setSessionExpired(true);
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [logout]);

  // Refresh the profile from the server; keep the decoded user if the network is down.
  useEffect(() => {
    if (!tokenStorage.get()) return;
    authApi.
    me().
    then(({ user: fresh }) => setUser(fresh)).
    catch((e) => {
      if (e instanceof ApiError && e.status === 401) logout();
    });
  }, [logout]);

  // Auto-logout when the token's exp passes while the tab is open.
  useEffect(() => {
    if (!user) return;
    const id = window.setInterval(() => {
      const token = tokenStorage.get();
      if (!token || isTokenExpired(token)) {
        logout();
        setSessionExpired(true);
      }
    }, 60_000);
    return () => window.clearInterval(id);
  }, [user, logout]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    const token = res.accessToken || res.token || '';
    tokenStorage.set(token, res.refreshToken);
    setSessionExpired(false);
    setUser({ ...res.user, name: res.user.fullName || res.user.name });
  }, []);

  const register = useCallback(async (input: { fullName?: string; name?: string; email: string; role: UserRole; password: string; phoneNumber?: string }) => {
    const fullName = (input.fullName || input.name || '').trim();
    const res = await authApi.register({
      ...input,
      fullName
    });
    const token = res.accessToken || res.token || '';
    tokenStorage.set(token, res.refreshToken);
    setSessionExpired(false);
    setUser({ ...res.user, name: res.user.fullName || res.user.name });
  }, []);

  const value = useMemo(
    () => ({ user, isAuthenticated: !!user, sessionExpired, login, register, logout }),
    [user, sessionExpired, login, register, logout]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}