import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { ApiResponse } from '@/shared/types/api.types';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://slotstudy.onrender.com/api/v1';

interface MobileRetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  _retryCount?: number;
  _skipRetry?: boolean;
}

const MAX_RETRIES = 3;

const instance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 45000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ── Request interceptor: attach token ──────────────────────────────
instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor: handle 401 refresh & server wake-up retry ─
instance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config as MobileRetryConfig | undefined;

    // 1. Handle 401 refresh
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
            refreshToken,
          });
          useAuthStore.getState().setTokens(data.data.accessToken, data.data.refreshToken);
          originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
          return instance(originalRequest);
        } catch {
          useAuthStore.getState().logout();
        }
      } else {
        useAuthStore.getState().logout();
      }
    }

    // 2. Retry Job for server waking up (cold start on Render) or transient network timeouts
    if (originalRequest && !originalRequest._skipRetry) {
      const currentRetry = originalRequest._retryCount || 0;
      const isNetworkOrTimeout =
        !error.response ||
        error.code === 'ECONNABORTED' ||
        error.code === 'ERR_NETWORK' ||
        error.code === 'ETIMEDOUT';
      const isTransientServerError =
        error.response?.status === 502 ||
        error.response?.status === 503 ||
        error.response?.status === 504 ||
        error.response?.status === 408;

      const url = originalRequest.url || '';
      const method = (originalRequest.method || 'get').toLowerCase();
      const isAuthRequest = url.includes('/auth/');
      const isIdempotent = method === 'get' || method === 'head' || method === 'options';

      if ((isNetworkOrTimeout || isTransientServerError) && (isAuthRequest || isIdempotent) && currentRetry < MAX_RETRIES) {
        originalRequest._retryCount = currentRetry + 1;
        const delay = Math.min(1500 * Math.pow(1.8, currentRetry), 6000);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return instance(originalRequest);
      }
    }

    return Promise.reject(error);
  },
);

let wakePromise: Promise<void> | null = null;

/**
 * Preemptively pings the backend server to wake it up from cold-start sleep
 * (e.g. Render / free hosting tier).
 */
export function wakeServer(): Promise<void> {
  if (!wakePromise) {
    wakePromise = axios
      .get(`${BASE_URL}/health`, { timeout: 15000 })
      .catch(() => axios.get(`${BASE_URL}`, { timeout: 15000 }))
      .then(() => {})
      .catch(() => {})
      .finally(() => {
        setTimeout(() => {
          wakePromise = null;
        }, 30000);
      });
  }
  return wakePromise;
}

// ── Typed API client methods ───────────────────────────────────────
export const apiClient = {
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    instance.get(url, config).then((res) => res.data),

  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    instance.post(url, data, config).then((res) => res.data),

  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    instance.put(url, data, config).then((res) => res.data),

  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    instance.patch(url, data, config).then((res) => res.data),

  delete: <T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    instance.delete(url, config).then((res) => res.data),

  upload: <T>(url: string, formData: FormData, onProgress?: (pct: number) => void): Promise<ApiResponse<T>> =>
    instance
      .post(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (onProgress && e.total) {
            onProgress(Math.round((e.loaded * 100) / e.total));
          }
        },
      })
      .then((res) => res.data),
};

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<{ message?: unknown }>(error)) {
    const rawMessage = error.message || '';
    const isTimeout =
      error.code === 'ECONNABORTED' ||
      error.code === 'ETIMEDOUT' ||
      rawMessage.toLowerCase().includes('timeout') ||
      rawMessage.includes('3000ms') ||
      rawMessage.includes('30000ms') ||
      rawMessage.includes('45000ms') ||
      error.response?.status === 504 ||
      error.response?.status === 408;

    if (isTimeout) {
      return 'System busy, please try again';
    }

    const message = error.response?.data?.message;
    if (typeof message === 'string' && message.trim()) {
      if (
        message.toLowerCase().includes('timeout') ||
        message.includes('3000ms') ||
        message.includes('30000ms')
      ) {
        return 'System busy, please try again';
      }
      return message;
    }

    if (Array.isArray(message)) {
      const details = message.filter(
        (item): item is string => typeof item === 'string',
      );
      if (details.length) {
        const joined = details.join('\n');
        if (
          joined.toLowerCase().includes('timeout') ||
          joined.includes('3000ms') ||
          joined.includes('30000ms')
        ) {
          return 'System busy, please try again';
        }
        return joined;
      }
    }

    if (error.response?.status === 502 || error.response?.status === 503) {
      return 'System busy, please try again';
    }

    if (!error.response && error.code === 'ERR_NETWORK') {
      return 'System busy, please try again';
    }

    return fallback;
  }

  if (error instanceof Error && error.message) {
    if (
      error.message.toLowerCase().includes('timeout') ||
      error.message.includes('3000ms') ||
      error.message.includes('30000ms')
    ) {
      return 'System busy, please try again';
    }
    return error.message;
  }

  return fallback;
}
