import express, { type Express } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import router from './routes/index.js';
import { logger } from './lib/logger.js';

const app: Express = express();

// ── Logging ────────────────────────────────────────────────────────────────────
app.use(
  pinoHttp({
    logger,
    serializers: {
      req: req => ({ id: req.id, method: req.method, url: req.url?.split('?')[0] }),
      res: res => ({ statusCode: res.statusCode }),
    },
  }),
);

// ── CORS — same-origin in Replit proxy, but allow credentials ─────────────────
app.use(cors({
  origin: true,           // reflect origin (needed for credentials)
  credentials: true,
}));

// ── Body / cookie parsing ──────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use('/api', router);

export default app;
