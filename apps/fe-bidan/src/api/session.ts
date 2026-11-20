import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export interface SessionOptions {
  storageKey: string;
  roleKey: string;
}

export const createSession = ({ storageKey, roleKey }: SessionOptions) => {
  const bacaToken = (): string | null => localStorage.getItem(storageKey);

  const simpanToken = (token: string): void => {
    localStorage.setItem(storageKey, token);
  };

  const bersihkan = (): void => {
    localStorage.removeItem(storageKey);
    localStorage.removeItem(roleKey);
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

  return { bacaToken, simpanToken, bersihkan, logout };
};

export type Session = ReturnType<typeof createSession>;
