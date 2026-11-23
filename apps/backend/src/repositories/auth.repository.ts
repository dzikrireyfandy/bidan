import db from '../db/pool';
import type { Peran, SubPeran } from '../types';

export interface AkunRow {
  akun_id: string;
  username?: string;
  password_hash: string;
  aktif: boolean;
  pasien_id: string | null;
  staf_id: string | null;
  sub_peran: SubPeran | null;
  peran: Peran;
  terkunci_sampai: Date | null;
  unit_id: string | null;
  nik?: string | null;
  email?: string | null;
  nama_pasien?: string | null;
  nama_staf?: string | null;
}

export interface OtpRow {
  otp_id: string;
  kode_hash: string;
}

export class AuthRepository {
  async findAkunByUsername(identifier: string): Promise<AkunRow | undefined> {
    const result = await db.query<AkunRow>(
      `SELECT a.akun_id, a.username, a.password_hash, a.aktif, a.pasien_id, a.staf_id, a.sub_peran,
              a.terkunci_sampai, p.kode AS peran, s.unit_id,
              pas.nik, COALESCE(a.email, pas.email, s.email) AS email,
              pas.nama AS nama_pasien, s.nama AS nama_staf
         FROM [Akun_Pengguna] a
         JOIN [Peran] p ON p.peran_id = a.peran_id
         LEFT JOIN [Staf] s ON s.staf_id = a.staf_id
         LEFT JOIN [Pasien] pas ON pas.pasien_id = a.pasien_id
        WHERE a.username = @identifier COLLATE Latin1_General_CS_AS
           OR pas.nik = @identifier
           OR a.email = @identifier
           OR pas.email = @identifier
           OR s.email = @identifier`,
      { identifier }
    );
    return result.recordset[0];
  }

  async findAkunIdByEmail(email: string): Promise<string | null> {
    const result = await db.query<{ akun_id: string }>(
      `SELECT a.akun_id FROM [Akun_Pengguna] a
         LEFT JOIN [Pasien] p ON p.pasien_id = a.pasien_id
         LEFT JOIN [Staf] s ON s.staf_id = a.staf_id
        WHERE a.email = @email OR p.email = @email OR s.email = @email`,
      { email }
    );
    return result.recordset[0]?.akun_id ?? null;
  }

  async recordFailedAttempt(akunId: string, username: string): Promise<void> {
    await db.query(
      `UPDATE [Akun_Pengguna]
          SET percobaan_gagal = percobaan_gagal + 1,
              terkunci_sampai = CASE WHEN percobaan_gagal + 1 >= 5
                                     THEN DATEADD(MINUTE, 15, SYSDATETIME()) ELSE terkunci_sampai END
        WHERE akun_id = @id`,
      { id: akunId },
      { akunId, userRef: username, keterangan: 'Login Gagal' }
    );
  }

  async recordLoginSuccess(akunId: string, username: string): Promise<void> {
    await db.query(
      `UPDATE [Akun_Pengguna] SET last_login_at = SYSDATETIME(), percobaan_gagal = 0 WHERE akun_id = @id`,
      { id: akunId },
      { akunId, userRef: username, keterangan: 'Login' }
    );
    await this.recordAudit(akunId, username, 'LOGIN', 'Login');
  }

  async registerPasienAkun(input: {
    username: string;
    passwordHash: string;
    nik: string;
    nama: string;
    email: string;
    noHp?: string;
    jenisKelamin?: string;
  }): Promise<{ akun_id: string; pasien_id: string; username: string; peran: Peran }> {
    let pasienRow = (
      await db.query<{ pasien_id: string }>(
        `SELECT pasien_id FROM [Pasien] WHERE nik = @nik`,
        { nik: input.nik }
      )
    ).recordset[0];

    let pasienId: string;
    if (pasienRow) {
      pasienId = pasienRow.pasien_id;
      await db.query(
        `UPDATE [Pasien] SET email = COALESCE(email, @email), no_telepon = COALESCE(no_telepon, @noHp) WHERE pasien_id = @id`,
        { id: pasienId, email: input.email, noHp: input.noHp ?? '08123456789' }
      );
    } else {
      const insertedPasien = await db.query<{ pasien_id: string }>(
        `INSERT INTO [Pasien] (pasien_id, no_rm, nik, nama, jenis_kelamin, tgl_lahir, tempat_lahir, alamat, no_telepon, gol_darah, status_pernikahan, pekerjaan, email)
         OUTPUT INSERTED.pasien_id
         VALUES (NEWID(), RIGHT('000000' + CAST(NEXT VALUE FOR dbo.Seq_NoRM AS VARCHAR(10)), 6),
                 @nik, @nama, @jk, '1995-01-01', N'Jambi', N'Kota Jambi', @noHp, 'O', 'MENIKAH', N'Ibu Rumah Tangga', @email)`,
        {
          nik: input.nik,
          nama: input.nama,
          jk: input.jenisKelamin === 'L' || input.jenisKelamin === 'LAKI_LAKI' ? 'L' : 'P',
          noHp: input.noHp ?? '08123456789',
          email: input.email
        }
      );
      const pid = insertedPasien.recordset[0]?.pasien_id;
      if (!pid) {
        throw new Error('Gagal membuat data pasien');
      }
      pasienId = pid;
    }

    const peranRow = (
      await db.query<{ peran_id: string }>(
        `SELECT TOP 1 peran_id FROM [Peran] WHERE kode = 'PASIEN'`
      )
    ).recordset[0];

    const peranId = peranRow?.peran_id;
    if (!peranId) {
      throw new Error('Peran PASIEN tidak ditemukan di database');
    }

    const insertedAkun = await db.query<{ akun_id: string }>(
      `INSERT INTO [Akun_Pengguna] (akun_id, peran_id, username, email, password_hash, aktif, percobaan_gagal, pasien_id)
       OUTPUT INSERTED.akun_id
       VALUES (NEWID(), @peranId, @username, @email, @hash, 1, 0, @pasienId)`,
      {
        peranId,
        username: input.username,
        email: input.email,
        hash: input.passwordHash,
        pasienId
      }
    );

    const aid = insertedAkun.recordset[0]?.akun_id;
    if (!aid) {
      throw new Error('Gagal membuat akun pengguna');
    }
    const akunId = aid;

    const pesanNotif = `Selamat ${input.nama}, akun portal pasien Bidan Ria berhasil dibuat. Gunakan username/NIK Anda untuk reservasi online.`;
    await this.recordNotification(input.email, pesanNotif, 'TERKIRIM');
    await this.recordAudit(akunId, input.username, 'INSERT', 'Registrasi akun pasien baru');

    return {
      akun_id: akunId,
      pasien_id: pasienId,
      username: input.username,
      peran: 'PASIEN'
    };
  }

  async recordAudit(akunId: string, userRef: string, aksi: string, keterangan: string): Promise<void> {
    await db.query(
      `INSERT INTO [Audit_Log] ([akun_id], [aksi], [tabel], [id_baris], [nilai_lama], [nilai_baru], [ip_address], [waktu], [user_ref], [keterangan])
       VALUES (@akunId, @aksi, N'Akun_Pengguna', @akunId, N'[]', N'[]',
               COALESCE(CONVERT(VARCHAR(45), CONNECTIONPROPERTY('client_net_address')), ''), SYSDATETIME(), @userRef, @ket)`,
      { akunId, aksi, userRef, ket: keterangan }
    );
  }

  async createOtp(akunId: string, kodeHash: string): Promise<void> {
    await db.query(
      `INSERT INTO [Otp_Reset] (akun_id, kode_hash, expired_at, dipakai)
       VALUES (@id, @hash, DATEADD(MINUTE, 15, SYSDATETIME()), 0)`,
      { id: akunId, hash: kodeHash }
    );
  }

  async recordNotification(
    email: string,
    pesan: string,
    status: 'TERKIRIM' | 'ANTRE' = 'ANTRE'
  ): Promise<void> {
    await db.query(
      `INSERT INTO [Notifikasi_Log] (jenis, tujuan, pesan, status, retry_count, waktu_kirim)
       VALUES ('OTP_RESET', @email, @pesan, @status, 0, SYSDATETIME())`,
      { email, pesan, status }
    );
  }

  async enqueueNotification(email: string, pesan: string): Promise<void> {
    await this.recordNotification(email, pesan, 'ANTRE');
  }

  async findActiveOtp(akunId: string): Promise<OtpRow | undefined> {
    const result = await db.query<OtpRow>(
      `SELECT TOP 1 otp_id, kode_hash FROM [Otp_Reset]
        WHERE akun_id = @id AND dipakai = 0 AND expired_at > SYSDATETIME()
        ORDER BY created_at DESC`,
      { id: akunId }
    );
    return result.recordset[0];
  }

  async updatePassword(akunId: string, hash: string): Promise<void> {
    await db.query(`UPDATE [Akun_Pengguna] SET password_hash = @hash WHERE akun_id = @id`, {
      id: akunId,
      hash
    });
  }

  async markOtpUsed(akunId: string): Promise<void> {
    await db.query(`UPDATE [Otp_Reset] SET dipakai = 1 WHERE akun_id = @id AND dipakai = 0`, {
      id: akunId
    });
  }
}

export default AuthRepository;
