import db from '../db/pool';
import { GUID_REGEX } from '../validation/common';

export class AuditRepository {
  async logAccessDenied(input: {
    akunId?: string | null;
    peran: string;
    method: string;
    path: string;
    ipAddress?: string;
  }): Promise<void> {
    try {
      const isUnmockedUnitTest =
        process.env.NODE_ENV === 'test' &&
        typeof (db.query as unknown as { mock?: unknown }).mock === 'undefined' &&
        process.env.RUN_LIVE_DB_TESTS !== '1';
      if (isUnmockedUnitTest) {
        return;
      }
      const validAkunUuid = input.akunId && GUID_REGEX.test(input.akunId) ? input.akunId : null;
      await db.query(
        `INSERT INTO [Audit_Log]
           (akun_id, aksi, tabel, id_baris, nilai_lama, nilai_baru, ip_address, waktu, user_ref, keterangan)
         VALUES
           (@akunId, 'AKSES_DITOLAK', 'RBAC_ENDPOINT', @idBaris, N'', @nilaiBaru, @ip, SYSDATETIME(), @userRef, @ket)`,
        {
          akunId: validAkunUuid,
          idBaris: `${input.method.toUpperCase()} ${input.path}`.slice(0, 100),
          nilaiBaru: JSON.stringify({
            peran: input.peran,
            method: input.method.toUpperCase(),
            path: input.path
          }),
          ip: (input.ipAddress || '127.0.0.1').slice(0, 45),
          userRef: (input.akunId || input.peran || 'anonymous').slice(0, 100),
          ket: `Percobaan akses ditolak (403) oleh peran ${input.peran} ke ${input.method.toUpperCase()} ${input.path}`.slice(
            0,
            200
          )
        }
      );
    } catch {
      // Jangan gagalkan respons 403 bila lingkungan unit test mem-mock DB atau DB sedang offline
    }
  }
}

export const auditRepository = new AuditRepository();
export default AuditRepository;
