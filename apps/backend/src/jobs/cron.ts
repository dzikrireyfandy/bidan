import cron from 'node-cron';
import config from '../config/env';
import db from '../db/pool';
import { isMailerEnabled, sendMail } from './mailer';

const TZ = 'Asia/Jakarta';
const tasks: Array<ReturnType<typeof cron.schedule>> = [];

const enqueueReservasi = async (): Promise<number> => {
  const result = await db.query<{ jumlah: number }>(
    `INSERT INTO [Notifikasi_Log] (reservasi_id, jenis, tujuan, pesan, status, retry_count, waktu_kirim)
     SELECT r.reservasi_id, 'PENGINGAT_RESERVASI', p.email,
            'Pengingat reservasi besok ' + CONVERT(VARCHAR(10), j.tanggal, 105) +
            ' pukul ' + CONVERT(VARCHAR(5), j.jam_mulai) + ' (' + ISNULL(l.nama, 'layanan') + ').',
            'ANTRE', 0, SYSDATETIME()
       FROM [Reservasi] r
       JOIN [Jadwal_Praktik] j ON j.jadwal_id = r.jadwal_id
       JOIN [Pasien] p ON p.pasien_id = r.pasien_id
       LEFT JOIN [Layanan_Medis] l ON l.layanan_id = r.layanan_id
      WHERE j.tanggal = CAST(DATEADD(DAY, 1, SYSDATETIME()) AS DATE)
        AND r.status = 'MENUNGGU'
        AND p.email IS NOT NULL
        AND NOT EXISTS (
              SELECT 1 FROM [Notifikasi_Log] n
               WHERE n.reservasi_id = r.reservasi_id
                 AND n.jenis = 'PENGINGAT_RESERVASI'
                 AND n.created_at >= CAST(SYSDATETIME() AS DATE));
     SELECT @@ROWCOUNT AS jumlah;`,
    {}
  );
  return result.recordset[0]?.jumlah ?? 0;
};

const enqueueKontrolKb = async (): Promise<number> => {
  const result = await db.query<{ jumlah: number }>(
    `INSERT INTO [Notifikasi_Log] (jenis, tujuan, pesan, status, retry_count, waktu_kirim)
     SELECT 'PENGINGAT_KB', p.email,
            'Pengingat kontrol KB besok (' + CONVERT(VARCHAR(10), kb.kontrol_berikutnya, 105) + ').',
            'ANTRE', 0, SYSDATETIME()
       FROM [Pelayanan_KB] kb
       JOIN [Pasien] p ON p.pasien_id = kb.pasien_id
      WHERE kb.kontrol_berikutnya = CAST(DATEADD(DAY, 1, SYSDATETIME()) AS DATE)
        AND p.email IS NOT NULL
        AND NOT EXISTS (
              SELECT 1 FROM [Notifikasi_Log] n
               WHERE n.jenis = 'PENGINGAT_KB'
                 AND n.tujuan = p.email
                 AND n.created_at >= CAST(SYSDATETIME() AS DATE));
     SELECT @@ROWCOUNT AS jumlah;`,
    {}
  );
  return result.recordset[0]?.jumlah ?? 0;
};

// ponytail: kontrol neonatal diasumsikan H+28 dari tanggal lahir; ubah bila jadwal resmi berbeda
const enqueueNeonatal = async (): Promise<number> => {
  const result = await db.query<{ jumlah: number }>(
    `INSERT INTO [Notifikasi_Log] (jenis, tujuan, pesan, status, retry_count, waktu_kirim)
     SELECT 'KONTROL_NEONATAL', p.email,
            'Pengingat kontrol neonatal besok untuk bayi ' + p.nama + '.',
            'ANTRE', 0, SYSDATETIME()
       FROM [Bayi_Lahir] b
       JOIN [Pasien] p ON p.pasien_id = b.pasien_id
      WHERE CAST(DATEADD(DAY, 28, p.tgl_lahir) AS DATE) = CAST(DATEADD(DAY, 1, SYSDATETIME()) AS DATE)
        AND p.email IS NOT NULL
        AND NOT EXISTS (
              SELECT 1 FROM [Notifikasi_Log] n
               WHERE n.jenis = 'KONTROL_NEONATAL'
                 AND n.tujuan = p.email
                 AND n.created_at >= CAST(SYSDATETIME() AS DATE));
     SELECT @@ROWCOUNT AS jumlah;`,
    {}
  );
  return result.recordset[0]?.jumlah ?? 0;
};

export const runDailyReminders = async (): Promise<void> => {
  try {
    const [reservasi, kb, neonatal] = await Promise.all([
      enqueueReservasi(),
      enqueueKontrolKb(),
      enqueueNeonatal()
    ]);
    console.log(`[cron] pengingat H-1: reservasi=${reservasi}, kb=${kb}, neonatal=${neonatal}`);
  } catch (err) {
    console.error('[cron] gagal menyiapkan pengingat H-1:', err instanceof Error ? err.message : err);
  }
};

export const flushQueue = async (): Promise<void> => {
  if (!isMailerEnabled()) {
    return;
  }
  try {
    const pending = await db.query<{ notif_id: string; tujuan: string; jenis: string; pesan: string }>(
      `SELECT TOP 50 notif_id, tujuan, jenis, pesan
         FROM [Notifikasi_Log]
        WHERE status = 'ANTRE' AND waktu_kirim <= SYSDATETIME()
        ORDER BY waktu_kirim ASC`,
      {}
    );

    for (const row of pending.recordset) {
      const terkirim = await sendMail(row.tujuan, row.jenis, row.pesan);
      await db.query(
        `UPDATE [Notifikasi_Log]
            SET status = @status,
                retry_count = retry_count + @inc,
                waktu_kirim = DATEADD(MINUTE, 15, SYSDATETIME())
          WHERE notif_id = @id`,
        {
          id: row.notif_id,
          status: terkirim ? 'TERKIRIM' : 'ANTRE',
          inc: terkirim ? 0 : 1
        }
      );
    }
  } catch (err) {
    console.error('[cron] gagal memproses antrean notifikasi:', err instanceof Error ? err.message : err);
  }
};

const sendWeeklyRecap = async (): Promise<void> => {
  const tujuan = config.SENDER_EMAIL ?? config.SMTP_USER;
  if (!isMailerEnabled() || !tujuan) {
    return;
  }
  try {
    const rekap = await db.query<Record<string, unknown>>(
      `SELECT COUNT(*) AS kunjungan,
              (SELECT ISNULL(SUM(jumlah), 0) FROM [Pembayaran]
                WHERE waktu_bayar >= DATEADD(DAY, -7, SYSDATETIME())) AS pendapatan
         FROM [Kunjungan]
        WHERE tgl_masuk >= DATEADD(DAY, -7, SYSDATETIME())`,
      {}
    );
    const row = rekap.recordset[0] ?? {};
    await sendMail(
      tujuan,
      'Rekap Mingguan',
      `Kunjungan 7 hari: ${String(row['kunjungan'] ?? 0)}\nPendapatan 7 hari: ${String(row['pendapatan'] ?? 0)}`
    );
  } catch (err) {
    console.error('[cron] gagal mengirim rekap mingguan:', err instanceof Error ? err.message : err);
  }
};

export const startJobs = (): void => {
  if (config.NODE_ENV === 'test') {
    return;
  }

  tasks.push(
    cron.schedule('0 8 * * *', () => { void runDailyReminders(); }, { timezone: TZ }),
    cron.schedule('*/5 * * * *', () => { void flushQueue(); }, { timezone: TZ }),
    cron.schedule('0 7 * * 1', () => { void sendWeeklyRecap(); }, { timezone: TZ })
  );

  console.log('[cron] background jobs aktif (Asia/Jakarta)');
};

export const stopJobs = (): void => {
  for (const task of tasks) {
    task.stop();
  }
  tasks.length = 0;
};
