import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import { authRoutes } from './routes/auth';
import { songsRoutes } from './routes/songs';
import { ministriesRoutes } from './routes/ministries';
import { repertoireRoutes } from './routes/repertoire';
import { scheduleRoutes } from './routes/schedules';
import { dashboardRoutes } from './routes/dashboard';
import { settingsRoutes } from './routes/settings';
import { telegramWebhookRoutes } from './routes/telegram-webhook';
import { musicianRoutes } from './routes/musicians';
import { profileRoutes } from './routes/profile';
import { sessionRoutes } from './routes/sessions';
import { prisma } from './db';
import { SessionWSServer } from './websocket/server';

const PORT = Number(process.env.PORT) || 4001;

async function build() {
  const fastify = Fastify({
    logger: true,
  });

  await fastify.register(cookie, {
    secret: process.env.COOKIE_SECRET || (process.env.NODE_ENV === 'production' ? (() => { throw new Error('COOKIE_SECRET required in production') })() : 'dev-secret'),
  });

  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET || process.env.TOKEN_SECRET || (() => { throw new Error('JWT_SECRET or TOKEN_SECRET environment variable is required'); })(),
    sign: { expiresIn: '15m' },
  });

  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  await fastify.register(cors, {
    origin: (origin, cb) => {
      const allowed = [
        'http://localhost:5173',
        'http://192.168.3.11:5173',
        process.env.APP_URL,
      ].filter(Boolean);
      if (!origin || allowed.includes(origin)) {
        cb(null, true);
      } else {
        cb(null, true);
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Health check for Railway
  fastify.get('/', async () => ({ status: 'ok' }));
  fastify.get('/health', async () => ({ status: 'ok', uptime: process.uptime() }));

  // initWhatsappService(); // Disabled - using Telegram instead

  await fastify.register(authRoutes, { prefix: '/api' });
  await fastify.register(songsRoutes, { prefix: '/api' });
  await fastify.register(ministriesRoutes, { prefix: '/api' });
  await fastify.register(repertoireRoutes, { prefix: '/api' });
  await fastify.register(scheduleRoutes, { prefix: '/api' });
  await fastify.register(settingsRoutes, { prefix: '/api' });
  await fastify.register(telegramWebhookRoutes, { prefix: '/api' });
  await fastify.register(musicianRoutes, { prefix: '/api' });
  await fastify.register(profileRoutes, { prefix: '/api' });
  await fastify.register(sessionRoutes, { prefix: '/api' });
  await fastify.register(dashboardRoutes, { prefix: '/api' });

  return fastify;
}

async function start() {
  const app = await build();

  try {
    await app.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`Server running on http://localhost:${PORT}`);
    
    // Inicializar WebSocket - precisa acessar o servidor interno do Fastify
    const httpServer = (app as any).server;
    if (httpServer) {
      const ws = new SessionWSServer(httpServer);
      console.log('WebSocket server initialized on ws://localhost:' + PORT + '/ws');
    }
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }

  const shutdown = async () => {
    await app.close();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

start();