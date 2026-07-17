/**
 * API Client — Bridge between React Frontend, Electron Desktop, and Cloud Backend (Render/MongoDB)
 *
 * All operations use a dual/hybrid approach:
 * 1. Synchronously read/write `localStorage` for immediate, zero-latency UI rendering and offline resilience.
 * 2. Asynchronously sync changes with the backend `/api/...` endpoints so data is persisted across global devices/clouds!
 */

export function getApiBaseUrl(): string {
  // Check global or env override first
  if (typeof window !== 'undefined' && (window as any).__API_URL__) {
    return (window as any).__API_URL__;
  }
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // Default to relative /api (handled by Express static serving online or Vite proxy in dev)
  return '/api';
}

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T | null> {
  try {
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;
    const resp = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
    if (!resp.ok) {
      console.warn(`API request to ${url} returned ${resp.status}`);
      return null;
    }
    return (await resp.json()) as T;
  } catch (err) {
    // Backend offline or unreachable (e.g. standalone local app offline)
    return null;
  }
}

/* ═══ USER ACCOUNTS SYNC ═══ */
export async function fetchCloudAccounts(): Promise<any[] | null> {
  const data = await apiFetch<{ accounts: any[] }>('auth/accounts');
  return data ? data.accounts : null;
}

export async function syncCloudAccount(account: any): Promise<boolean> {
  const data = await apiFetch('auth/sync-account', {
    method: 'POST',
    body: JSON.stringify({ account }),
  });
  return !!data;
}

export async function deleteCloudAccount(id: string): Promise<boolean> {
  const data = await apiFetch(`auth/accounts/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  return !!data;
}

/* ═══ ENCRYPTED VAULTS SYNC ═══ */
export async function fetchCloudVault(userId: string): Promise<string | null> {
  const data = await apiFetch<{ encryptedData: string | null }>(`vault/${encodeURIComponent(userId)}`);
  return data && data.encryptedData ? data.encryptedData : null;
}

export async function saveCloudVault(userId: string, encryptedData: string): Promise<boolean> {
  const data = await apiFetch(`vault/${encodeURIComponent(userId)}`, {
    method: 'POST',
    body: JSON.stringify({ encryptedData }),
  });
  return !!data;
}

/* ═══ CHAT MESSAGES SYNC ═══ */
export async function fetchCloudChatMessages(limit = 100): Promise<any[] | null> {
  const data = await apiFetch<{ messages: any[] }>(`chat/messages?limit=${limit}`);
  return data ? data.messages : null;
}

export async function syncCloudChatMessage(message: any): Promise<boolean> {
  const data = await apiFetch('chat/messages', {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
  return !!data;
}

/* ═══ ARENA SNAPSHOTS SYNC ═══ */
export async function fetchCloudSnapshots(): Promise<Record<string, any> | null> {
  const data = await apiFetch<{ snapshots: Record<string, any> }>('arena/snapshots');
  return data ? data.snapshots : null;
}

export async function syncCloudSnapshot(snapshot: any): Promise<boolean> {
  const data = await apiFetch('arena/snapshots', {
    method: 'POST',
    body: JSON.stringify({ snapshot }),
  });
  return !!data;
}
