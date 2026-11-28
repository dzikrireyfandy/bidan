jest.mock('../../src/db/pool', () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
    execute: jest.fn(),
    transaction: jest.fn(),
    close: jest.fn(),
    connect: jest.fn()
  },
  SqlConnection: class SqlConnectionStub {}
}));

jest.mock('../../src/jobs/mailer', () => ({
  sendMail: jest.fn(),
  isMailerEnabled: jest.fn(() => true),
  verifyMailer: jest.fn(),
  alamatPengirim: jest.fn(() => 'test@example.com')
}));

import bcrypt from 'bcryptjs';
import { AuthService } from '../../src/services/auth.service';
import type AuthRepository from '../../src/repositories/auth.repository';
import { sendMail } from '../../src/jobs/mailer';
import { renderOtpEmailHtml, renderPengingatEmailHtml } from '../../src/jobs/emailTemplates';
import { ambilError } from './helpers';

const sendMailMock = sendMail as jest.MockedFunction<typeof sendMail>;

const buatRepo = () => ({
  findAkunByUsername: jest.fn(),
  recordFailedAttempt: jest.fn().mockResolvedValue(undefined),
  recordLoginSuccess: jest.fn().mockResolvedValue(undefined),
  findAkunIdByEmail: jest.fn(),
  createOtp: jest.fn().mockResolvedValue(undefined),
  recordNotification: jest.fn().mockResolvedValue(undefined),
  enqueueNotification: jest.fn().mockResolvedValue(undefined),
  findActiveOtp: jest.fn(),
  updatePassword: jest.fn().mockResolvedValue(undefined),
  markOtpUsed: jest.fn().mockResolvedValue(undefined),
  recordAudit: jest.fn().mockResolvedValue(undefined)
});

type RepoMock = ReturnType<typeof buatRepo>;

const buatService = (repo: RepoMock) => new AuthService(repo as unknown as AuthRepository);

const akun = async (overrides: Record<string, unknown> = {}) => ({
  akun_id: 'akun-1',
  username: 'perawat',
  password_hash: await bcrypt.hash('rahasia123', 4),
  peran: 'STAFF' as const,
  sub_peran: 'PERAWAT' as const,
  staf_id: 'staf-1',
  pasien_id: null,
  unit_id: null,
  aktif: true,
  terkunci_sampai: null,
  ...overrides
});

describe('AuthService', () => {
  let repo: RepoMock;
  let service: AuthService;

  beforeEach(() => {
    repo = buatRepo();
    service = buatService(repo);
    sendMailMock.mockReset();
  });

  test('login menolak akun yang tidak ada dengan ERR-AUTH-02', async () => {
    repo.findAkunByUsername.mockResolvedValue(null);

    const err = await ambilError(service.login('hantu', 'rahasia123'));

    expect(err).toMatchObject({ statusCode: 401, errorId: 'ERR-AUTH-02' });
  });

  test('login menolak akun nonaktif', async () => {
    repo.findAkunByUsername.mockResolvedValue(await akun({ aktif: false }));

    const err = await ambilError(service.login('perawat', 'rahasia123'));

    expect(err).toMatchObject({ statusCode: 401, errorId: 'ERR-AUTH-02' });
  });

  test('login menolak akun yang sedang terkunci', async () => {
    repo.findAkunByUsername.mockResolvedValue(
      await akun({ terkunci_sampai: new Date(Date.now() + 60_000) })
    );

    const err = await ambilError(service.login('perawat', 'rahasia123'));

    expect(err).toMatchObject({ statusCode: 403, errorId: 'ERR-LOCK-01' });
  });

  test('login dengan kata sandi salah mencatat percobaan gagal', async () => {
    repo.findAkunByUsername.mockResolvedValue(await akun());

    const err = await ambilError(service.login('perawat', 'salah-sekali'));

    expect(err).toMatchObject({ statusCode: 401, errorId: 'ERR-AUTH-02' });
    expect(repo.recordFailedAttempt).toHaveBeenCalledWith('akun-1', 'perawat');
    expect(repo.recordLoginSuccess).not.toHaveBeenCalled();
  });

  test('login sukses mengembalikan token dan profil', async () => {
    repo.findAkunByUsername.mockResolvedValue(await akun());

    const hasil = await service.login('perawat', 'rahasia123');

    expect(repo.recordLoginSuccess).toHaveBeenCalledWith('akun-1', 'perawat');
    expect(hasil.peran).toBe('STAFF');
    expect(hasil.subPeran).toBe('PERAWAT');
    expect(typeof hasil.token).toBe('string');
    expect(hasil.token.split('.')).toHaveLength(3);
  });

  test('logout mencatat audit LOGOUT dengan akun dan user_ref', async () => {
    await service.logout({
      akunId: 'akun-1',
      peran: 'STAFF',
      subPeran: 'PERAWAT',
      stafId: 'staf-1',
      pasienId: null,
      unitId: null
    });

    expect(repo.recordAudit).toHaveBeenCalledWith('akun-1', 'STAFF:PERAWAT', 'LOGOUT', 'Logout');
  });

  test('refresh menerbitkan token baru dari konteks auth', () => {
    const hasil = service.refresh({
      akunId: 'akun-1',
      peran: 'DOKTER',
      subPeran: null,
      stafId: 'staf-1',
      pasienId: null,
      unitId: 'unit-1'
    });

    expect(hasil.token.split('.')).toHaveLength(3);
  });

  test('requestReset untuk email tidak terdaftar tetap memberi pesan generik', async () => {
    repo.findAkunIdByEmail.mockResolvedValue(null);

    const hasil = await service.requestReset('tidak-ada@example.com');

    expect(hasil.message).toContain('Jika email terdaftar');
    expect(repo.createOtp).not.toHaveBeenCalled();
    expect(repo.recordNotification).not.toHaveBeenCalled();
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  test('requestReset mengirim OTP langsung dan mencatat TERKIRIM', async () => {
    repo.findAkunIdByEmail.mockResolvedValue('akun-1');
    sendMailMock.mockResolvedValue(true);

    await service.requestReset('perawat@example.com');

    expect(repo.createOtp).toHaveBeenCalledWith('akun-1', expect.any(String));
    expect(sendMailMock).toHaveBeenCalledWith(
      'perawat@example.com',
      'Kode OTP Reset Kata Sandi',
      expect.stringContaining('Kode OTP')
    );
    expect(repo.recordNotification).toHaveBeenCalledWith(
      'perawat@example.com',
      expect.stringContaining('Kode OTP'),
      'TERKIRIM'
    );
    expect(repo.enqueueNotification).not.toHaveBeenCalled();
  });

  test('requestReset mengantrekan notifikasi bila SMTP gagal', async () => {
    repo.findAkunIdByEmail.mockResolvedValue('akun-1');
    sendMailMock.mockResolvedValue(false);

    await service.requestReset('perawat@example.com');

    expect(repo.recordNotification).toHaveBeenCalledWith(
      'perawat@example.com',
      expect.stringContaining('Kode OTP'),
      'ANTRE'
    );
  });

  test('verifyReset menolak email yang tidak terdaftar', async () => {
    repo.findAkunIdByEmail.mockResolvedValue(null);

    const err = await ambilError(service.verifyReset('hantu@example.com', '123456', 'baru12345'));

    expect(err).toMatchObject({ statusCode: 422, errorId: 'ERR-AUTH-05' });
  });

  test('verifyReset menolak OTP yang salah', async () => {
    repo.findAkunIdByEmail.mockResolvedValue('akun-1');
    repo.findActiveOtp.mockResolvedValue({ kode_hash: await bcrypt.hash('654321', 4) });

    const err = await ambilError(service.verifyReset('perawat@example.com', '123456', 'baru12345'));

    expect(err).toMatchObject({ statusCode: 422, errorId: 'ERR-AUTH-05' });
    expect(repo.updatePassword).not.toHaveBeenCalled();
  });

  test('verifyReset sukses menyimpan hash kata sandi baru', async () => {
    repo.findAkunIdByEmail.mockResolvedValue('akun-1');
    repo.findActiveOtp.mockResolvedValue({ kode_hash: await bcrypt.hash('123456', 4) });

    const hasil = await service.verifyReset('perawat@example.com', '123456', 'baru12345');

    const hashBaru = repo.updatePassword.mock.calls[0]?.[1] as string;
    await expect(bcrypt.compare('baru12345', hashBaru)).resolves.toBe(true);
    expect(repo.markOtpUsed).toHaveBeenCalledWith('akun-1');
    expect(hasil.message).toContain('berhasil');
  });

  test('template email OTP dan pengingat kunjungan merender seluruh variabel dengan benar', () => {
    const otpHtml = renderOtpEmailHtml({ kodeOtp: '654321', urlSistem: 'http://localhost:5173' });
    expect(otpHtml).toContain('Kode Verifikasi');
    expect(otpHtml).toContain('654321');
    expect(otpHtml).toContain('10 menit');
    expect(otpHtml).toContain('Praktek Mandiri Bidan Ria Indrasti J., S.Keb');
    expect(otpHtml).not.toContain('{{');

    const reminderHtml = renderPengingatEmailHtml({
      namaPasien: 'Siti Aminah',
      nomorAntrean: 'A-005',
      namaLayanan: 'Pemeriksaan Kehamilan (ANC)',
      tanggalKunjungan: '28-11-2026',
      sesiPraktik: '08:00 - 12:00 WIB',
      urlSistem: 'http://localhost:5173'
    });
    expect(reminderHtml).toContain('Pengingat Kunjungan');
    expect(reminderHtml).toContain('Siti Aminah');
    expect(reminderHtml).toContain('A-005');
    expect(reminderHtml).toContain('Pemeriksaan Kehamilan (ANC)');
    expect(reminderHtml).toContain('28-11-2026');
    expect(reminderHtml).toContain('08:00 - 12:00 WIB');
    expect(reminderHtml).not.toContain('{{');
  });
});
