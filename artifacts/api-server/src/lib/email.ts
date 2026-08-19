import nodemailer from 'nodemailer';
import { logger } from './logger.js';

function createTransport() {
  const host = process.env['EMAIL_HOST'];
  const port = Number(process.env['EMAIL_PORT'] ?? 465);
  const user = process.env['EMAIL_USERNAME'];
  const pass = process.env['EMAIL_PASSWORD'];

  if (!host || !user || !pass) {
    logger.warn('Email credentials not configured — email sending disabled');
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: true,   // SSL on 465
    auth: { user, pass },
  });
}

let _transport: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransport() {
  if (!_transport) _transport = createTransport();
  return _transport;
}

export interface InviteEmailOpts {
  to:      string;
  token:   string;
  role:    string;
  baseUrl: string;
}

export async function sendInviteEmail(opts: InviteEmailOpts): Promise<boolean> {
  const transport = getTransport();
  if (!transport) return false;

  const roleLabel = opts.role === 'dealer' ? 'Дилер' : 'Коллекционер';
  const link = `${opts.baseUrl}/register/${opts.token}`;

  try {
    await transport.sendMail({
      from:    `"4BOR Клуб" <${process.env['EMAIL_USERNAME']}>`,
      to:      opts.to,
      subject: `Приглашение в 4BOR Клуб — ${roleLabel}`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #f4f1eb; padding: 40px;">
          <h1 style="color: #1e3461; font-size: 28px; margin-bottom: 8px;">4BOR / <span style="color: #c9a84c;">КЛУБ</span></h1>
          <p style="color: #555; font-size: 14px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 32px;">Закрытый клуб дилеров и коллекционеров монет</p>

          <p style="color: #333; font-size: 16px; line-height: 1.6;">Вас приглашают присоединиться к закрытому клубу в роли <strong>${roleLabel}</strong>.</p>

          <div style="margin: 32px 0;">
            <a href="${link}"
               style="background: #c9a84c; color: #fff; padding: 14px 28px; text-decoration: none;
                      font-size: 15px; font-family: Georgia, serif; display: inline-block;">
              Принять приглашение
            </a>
          </div>

          <p style="color: #999; font-size: 12px;">Или перейдите по ссылке: ${link}</p>
          <p style="color: #999; font-size: 12px; margin-top: 24px; border-top: 1px solid #ddd; padding-top: 16px;">
            Ссылка действительна 7 дней. Не пересылайте её третьим лицам.
          </p>
        </div>
      `,
    });
    return true;
  } catch (err) {
    logger.error({ err }, 'Failed to send invite email');
    return false;
  }
}
