/**
 * Wrapper fetch — utilise les rewrites de Next vers le backend.
 * Côté navigateur, on tape /api/* qui est rewrite vers http://backend:4000/api/*
 */
const BASE = '/api';

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  const ct = res.headers.get('content-type') ?? '';
  if (ct.includes('application/json')) return res.json();
  return (await res.text()) as unknown as T;
}

export const api = {
  get: <T>(path: string) => http<T>(path),
  post: <T>(path: string, body?: any) => http<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) }),
  patch: <T>(path: string, body?: any) => http<T>(path, { method: 'PATCH', body: JSON.stringify(body ?? {}) }),
  del: <T>(path: string) => http<T>(path, { method: 'DELETE' }),
};
