import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

/** Perpanjang token bila sisa masa berlaku kurang dari 5 menit. */
const REFRESH_MARGIN_SECONDS = 5 * 60;

export interface SessionOptions {
  storageKey: string;
  roleKey: string;
}

const decodeExp = (token: string): number | null => {
  const payloadPart = token.split('.')[1];
  if (!payloadPart) return null;
  try {
    const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const payload = JSON.parse(atob(padded)) as { exp?: number };
    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
};

export const createSession = ({ storageKey, roleKey }: SessionOptions) => {
  let refreshing: Promise<void> | null = null;

  const bacaToken = (): string | null => localStorage.getItem(storageKey);

  const simpanToken = (token: string): void => {
    localStorage.setItem(storageKey, token);
  };

  const bersihkan = (): void => {
    localStorage.removeItem(storageKey);
    localStorage.removeItem(roleKey);
  };

  const perluRefresh = (token: string): boolean => {
    const exp = decodeExp(token);
    if (!exp) return false;
    return exp - Date.now() / 1000 < REFRESH_MARGIN_SECONDS;
  };

  const refresh = async (): Promise<void> => {
    const token = bacaToken();
    if (!token) return;
    if (refreshing) return refreshing;

    refreshing = axios
      .post<{ success: true; data: { token: string } }>(
        `${API_BASE_URL}/auth/refresh`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((response) => {
        const tokenBaru = response.data?.data?.token;
        if (tokenBaru) simpanToken(tokenBaru);
      })
      .catch((err: unknown) => {
        // Sesi benar-benar habis: bersihkan dan kembali ke halaman login.
        if (axios.isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)) {
          bersihkan();
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
      })
      .finally(() => {
        refreshing = null;
      });

    return refreshing;
  };

  const logout = async (): Promise<void> => {
    const token = bacaToken();
    try {
      if (token) {
        await axios.post(
          `${API_BASE_URL}/auth/logout`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    } catch {
      // Logout lokal tetap dilakukan walau server tidak dapat dihubungi.
    } finally {
      bersihkan();
    }
  };

  return { bacaToken, simpanToken, bersihkan, perluRefresh, refresh, logout };
};

export type Session = ReturnType<typeof createSession>;
