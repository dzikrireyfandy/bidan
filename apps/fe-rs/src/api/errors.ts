import axios from 'axios';
import type { ApiErrorBody } from './types';

interface ValidationDetail {
  path?: Array<string | number>;
  message?: string;
}

const detailMessages = (details: unknown): string[] => {
  if (!Array.isArray(details)) return [];
  return details.flatMap((item) => {
    if (typeof item !== 'object' || item === null) return [];
    const detail = item as ValidationDetail;
    if (typeof detail.message !== 'string' || detail.message.length === 0) return [];
    const path = Array.isArray(detail.path) ? detail.path.join('.') : '';
    return [path ? `${path}: ${detail.message}` : detail.message];
  });
};

/**
 * Mengubah error Axios menjadi pesan yang siap ditampilkan.
 * Untuk HTTP 422, detail validasi per field ikut digabungkan.
 */
export const pesanErrorApi = (
  err: unknown,
  fallback = 'Terjadi kesalahan. Silakan coba lagi.'
): string => {
  if (!axios.isAxiosError(err)) return fallback;
  if (!err.response) return 'Tidak dapat terhubung ke server. Periksa koneksi Anda.';

  const body = err.response.data as ApiErrorBody | undefined;
  const pesan = body?.error?.message;

  if (err.response.status === 422) {
    const detail = detailMessages(body?.error?.details);
    if (detail.length > 0) {
      return `${pesan ?? 'Periksa kembali isian Anda'}: ${detail.join('; ')}`;
    }
  }

  return pesan || fallback;
};
