import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

function hasSmtpConfig() {
  return Boolean(env.smtpHost && env.smtpPort && env.smtpFrom);
}

function buildTransport() {
  const port = Number(env.smtpPort);
  const secure = env.smtpSecure !== null ? env.smtpSecure : port === 465;

  return nodemailer.createTransport({
    host: env.smtpHost,
    port,
    secure,
    auth: env.smtpUser ? { user: env.smtpUser, pass: env.smtpPass } : undefined
  });
}

export function ensureMailerConfigured() {
  if (!hasSmtpConfig()) {
    const err = new Error('SMTP is not configured');
    err.code = 'EMAIL_NOT_CONFIGURED';
    throw err;
  }
}

export async function sendPasswordResetEmail({ to, resetLink }) {
  ensureMailerConfigured();
  const transport = buildTransport();

  const subject = 'Reset your MindBridge password';
  const text = [
    'We received a request to reset your MindBridge password.',
    `Reset link: ${resetLink}`,
    'This link expires in 60 minutes and can only be used once.',
    'If you did not request this, you can ignore this email.'
  ].join('\n\n');

  await transport.sendMail({
    from: env.smtpFrom,
    to,
    subject,
    text
  });
}
