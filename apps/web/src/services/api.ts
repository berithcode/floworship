const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Wrapper around fetch com auto-refresh na primeira 401.
 * Se o access token expirar, tenta renovar via /auth/refresh (cookie httpOnly)
 * e repete a requisição original uma única vez.
 */
export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const res = await fetch(input, { ...init, credentials: 'include' });

  if (res.status !== 401) return res;

  // Já tentando refresh, espera resultado
  if (isRefreshing && refreshPromise) {
    const ok = await refreshPromise;
    if (ok) {
      return fetch(input, { ...init, credentials: 'include' });
    }
    return res;
  }

  // Primeira 401 — dispara refresh
  isRefreshing = true;
  refreshPromise = tryRefresh();

  const ok = await refreshPromise;
  isRefreshing = false;
  refreshPromise = null;

  if (ok) {
    return fetch(input, { ...init, credentials: 'include' });
  }

  // Refresh falhou — redireciona pro login
  window.location.href = '/login';
  return res;
}
