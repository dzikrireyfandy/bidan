import nodemailer from 'nodemailer';
import config from '../config/env';

const port = config.SMTP_PORT ?? 587;

const transport = config.SMTP_HOST
  ? nodemailer.createTransport({
      host: config.SMTP_HOST,
      port,
      secure: port === 465,
      auth: config.SMTP_USER ? { user: config.SMTP_USER, pass: config.SMTP_PASS ?? '' } : undefined
    })
  : null;

export const isMailerEnabled = (): boolean => transport !== null;

export const sendMail = async (to: string, subject: string, text: string): Promise<boolean> => {
  if (!transport) {
    return false;
  }
  try {
    await transport.sendMail({
      from: config.SMTP_USER ?? 'no-reply@localhost',
      to,
      subject,
      text
    });
    return true;
  } catch (err) {
    console.error('[mailer] gagal kirim ke', to, err instanceof Error ? err.message : err);
    return false;
  }
};
