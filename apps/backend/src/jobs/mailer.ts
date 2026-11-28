import nodemailer from 'nodemailer';
import config from '../config/env';
import { renderOtpEmailHtml, SUBJECT_OTP_EMAIL } from './emailTemplates';

const port = config.SMTP_PORT ?? 587;

const transport = config.SMTP_HOST
  ? nodemailer.createTransport({
      host: config.SMTP_HOST,
      port,
      secure: port === 465,
      auth: config.SMTP_USER ? { user: config.SMTP_USER, pass: config.SMTP_PASS ?? '' } : undefined
    })
  : null;

/** Alamat pengirim harus terverifikasi di Brevo; SMTP_USER hanya akun relay. */
export const alamatPengirim = (): string =>
  config.SENDER_EMAIL ?? config.SMTP_USER ?? 'no-reply@localhost';

export const urlSistemPublik = (): string =>
  config.ALLOWED_ORIGINS[0] ?? 'http://localhost:5173';

export const isMailerEnabled = (): boolean => transport !== null;

/** Cek kredensial SMTP saat startup tanpa menggagalkan server. */
export const verifyMailer = async (): Promise<boolean> => {
  if (!transport) {
    return false;
  }
  try {
    await transport.verify();
    return true;
  } catch (err) {
    console.error('[mailer] verifikasi SMTP gagal:', err instanceof Error ? err.message : err);
    return false;
  }
};

export const sendMail = async (
  to: string,
  subject: string,
  text: string,
  html?: string
): Promise<boolean> => {
  if (!transport) {
    return false;
  }
  try {
    let resolvedSubject = subject;
    let resolvedHtml = html;

    if (!resolvedHtml) {
      const otpMatch = String(text ?? '').match(/Kode OTP[^0-9]*(\d{6})/i);
      if (otpMatch?.[1]) {
        resolvedHtml = renderOtpEmailHtml({
          kodeOtp: otpMatch[1],
          urlSistem: urlSistemPublik()
        });
        if (subject === 'OTP_RESET' || subject === 'Kode OTP Reset Kata Sandi') {
          resolvedSubject = SUBJECT_OTP_EMAIL;
        }
      }
    }

    await transport.sendMail({
      from: { name: 'Praktek Mandiri Bidan Ria Indrasti J., S.Keb', address: alamatPengirim() },
      to,
      subject: resolvedSubject,
      text,
      ...(resolvedHtml ? { html: resolvedHtml } : {})
    });
    return true;
  } catch (err) {
    console.error('[mailer] gagal kirim ke', to, err instanceof Error ? err.message : err);
    return false;
  }
};
