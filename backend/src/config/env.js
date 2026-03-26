import dotenv from 'dotenv';

dotenv.config();

const isTest = process.env.NODE_ENV === 'test';

const required = ['MONGO_URI', 'JWT_SECRET'];

for (const key of required) {
  if (!process.env[key]) {
    if (isTest) continue;
    throw new Error(`Missing required env var: ${key}`);
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT ? Number(process.env.PORT) : 4000,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/mental_health_support_test',
  jwtSecret: process.env.JWT_SECRET || 'test_secret',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  appBaseUrl: process.env.APP_BASE_URL || process.env.CORS_ORIGIN || 'http://localhost:3000',
  passwordResetTtlMinutes: process.env.PASSWORD_RESET_TTL_MINUTES ? Number(process.env.PASSWORD_RESET_TTL_MINUTES) : 60,
  sessionBaseUrl: process.env.SESSION_BASE_URL || 'https://meet.jit.si',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModelText: process.env.GEMINI_MODEL_TEXT || 'gemini-1.5-flash',
  geminiModelVision: process.env.GEMINI_MODEL_VISION || 'gemini-1.5-flash',
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: process.env.SMTP_PORT || '',
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  smtpFrom: process.env.SMTP_FROM || '',
  smtpSecure: process.env.SMTP_SECURE === undefined ? null : process.env.SMTP_SECURE === 'true',
  adminEmail: process.env.ADMIN_EMAIL || '',
  adminPassword: process.env.ADMIN_PASSWORD || '',
  adminName: process.env.ADMIN_NAME || 'MindBridge Admin'
};
