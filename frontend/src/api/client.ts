import { ApiErrorBody, FieldError } from '../types/auth';

export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:5000/api/v1';

export const UNAUTHORIZED_EVENT = 'agriguard:unauthorized';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message?: string,
    public fieldErrors: FieldError[] = []
  ) {
    super(message || code);
    this.name = 'ApiError';
  }
}

const TOKEN_KEY = 'agriguard.token';
const REFRESH_TOKEN_KEY = 'agriguard.refreshToken';

export const tokenStorage = {
  get(): string | null {
    try {
      return window.localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  getRefresh(): string | null {
    try {
      return window.localStorage.getItem(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string, refreshToken?: string) {
    try {
      window.localStorage.setItem(TOKEN_KEY, token);
      if (refreshToken) {
        window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      }
    } catch {
      // storage unavailable
    }
  },
  clear() {
    try {
      window.localStorage.removeItem(TOKEN_KEY);
      window.localStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch {
      // ignore
    }
  }
};

const config = {
  useMock: import.meta.env.VITE_ENABLE_MOCK_API === 'true',
  failure: 'none' as 'none' | 'error' | 'offline'
};

export function configureApi(next: Partial<typeof config>) {
  Object.assign(config, next);
}

export function isMockEnabled() {
  return config.useMock;
}

// Concurrency lock for token refresh
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

/**
 * Perform token refresh when an access token expires
 */
async function refreshAccessToken(): Promise<string | null> {
  const currentRefresh = tokenStorage.getRefresh();
  if (!currentRefresh) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ refreshToken: currentRefresh })
    });

    if (!res.ok) {
      tokenStorage.clear();
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
      return null;
    }

    const payload = await res.json();
    const newAccess = payload.data?.accessToken;
    const newRefresh = payload.data?.refreshToken;
    if (newAccess) {
      tokenStorage.set(newAccess, newRefresh);
      return newAccess;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Standard typed JSON API request with automatic auth headers & transparent refresh
 */
export async function apiRequest<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
  isRetry = false
): Promise<T> {
  // If explicitly in mock mode, route through legacy mockApi
  if (config.useMock) {
    const { mockFetch } = await import('../utils/mockApi');
    const token = tokenStorage.get();
    const { status, data } = await mockFetch(method, path, body, token, config.failure);
    if (status < 200 || status >= 300) {
      const err = (data ?? {}) as ApiErrorBody;
      throw new ApiError(status, err.code ?? 'UNKNOWN', err.message, err.errors ?? []);
    }
    return data as T;
  }

  const token = tokenStorage.get();
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
  } catch (err: any) {
    throw new ApiError(0, 'NETWORK_ERROR', 'Network communication failure. Please verify the backend service is running.');
  }

  // Handle 401 Unauthorized with token refresh retry
  if (res.status === 401 && !isRetry && tokenStorage.getRefresh()) {
    if (!isRefreshing) {
      isRefreshing = true;
      const newToken = await refreshAccessToken();
      isRefreshing = false;
      if (newToken) {
        onRefreshed(newToken);
        return apiRequest<T>(method, path, body, true);
      }
    } else {
      return new Promise<T>((resolve, reject) => {
        subscribeTokenRefresh((newToken) => {
          if (newToken) {
            resolve(apiRequest<T>(method, path, body, true));
          } else {
            reject(new ApiError(401, 'UNAUTHORIZED', 'Session expired. Please sign in again.'));
          }
        });
      });
    }
  }

  let data: any = null;
  if (res.status !== 204) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  }

  if (res.status === 401) {
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
  }

  if (!res.ok) {
    const errBody = data as ApiErrorBody;
    const code = errBody?.error?.code || errBody?.code || `HTTP_${res.status}`;
    const message = errBody?.message || 'API request failed';
    const details = errBody?.error?.details || errBody?.errors || [];
    throw new ApiError(res.status, code, message, details);
  }

  // Backend standard envelope: { success: true, message: '...', data: ... }
  if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
    return data.data as T;
  }

  return data as T;
}

/**
 * Standard typed Multipart/form-data upload
 */
export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const token = tokenStorage.get();
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

  let res: Response;
  try {
    // Note: Never set Content-Type header manually with FormData!
    res = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: formData
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Network error occurred during file upload');
  }

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const errBody = data as ApiErrorBody;
    const code = errBody?.error?.code || errBody?.code || `HTTP_${res.status}`;
    const message = errBody?.message || 'Upload failed';
    const details = errBody?.error?.details || errBody?.errors || [];
    throw new ApiError(res.status, code, message, details);
  }

  if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
    return data.data as T;
  }

  return data as T;
}
