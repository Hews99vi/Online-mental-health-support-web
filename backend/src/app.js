import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import healthRoutes from './routes/health.js';
import authRoutes from './routes/auth.js';
import secureRoutes from './routes/secure.js';
import profileRoutes from './routes/profile.js';
import consentRoutes from './routes/consent.js';
import crisisRoutes from './routes/crisis.js';
import aiRoutes from './routes/ai.js';
import moodRoutes from './routes/mood.js';
import journalRoutes from './routes/journal.js';
import libraryRoutes from './routes/library.js';
import chatRoutes from './routes/chat.js';
import therapistRoutes from './routes/therapist.js';
import therapistToolsRoutes from './routes/therapistTools.js';
import listenerRoutes from './routes/listener.js';
import appointmentRoutes from './routes/appointments.js';
import adminRoutes from './routes/admin.js';
import dashboardRoutes from './routes/dashboard.js';
import { enforceRequiredConsent } from './middleware/consent.js';
import { notFound, errorHandler } from './middleware/error.js';

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.corsOrigin }));
  app.use(express.json());

  if (env.nodeEnv !== 'production') {
    app.use((req, res, next) => {
      const startedAt = Date.now();
      res.on('finish', () => {
        const durationMs = Date.now() - startedAt;
        console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms`);
      });
      next();
    });
  }

  app.use('/api', healthRoutes);
  app.use('/api', authRoutes);
  app.use('/api', consentRoutes);
  app.use('/api', crisisRoutes);

  app.use('/api', enforceRequiredConsent, libraryRoutes);
  app.use('/api', enforceRequiredConsent, secureRoutes);
  app.use('/api', enforceRequiredConsent, profileRoutes);
  app.use('/api', enforceRequiredConsent, aiRoutes);
  app.use('/api', enforceRequiredConsent, moodRoutes);
  app.use('/api', enforceRequiredConsent, journalRoutes);
  app.use('/api', enforceRequiredConsent, chatRoutes);
  app.use('/api', enforceRequiredConsent, therapistRoutes);
  app.use('/api', enforceRequiredConsent, therapistToolsRoutes);
  app.use('/api', enforceRequiredConsent, listenerRoutes);
  app.use('/api', enforceRequiredConsent, appointmentRoutes);
  app.use('/api', enforceRequiredConsent, adminRoutes);
  app.use('/api', enforceRequiredConsent, dashboardRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
