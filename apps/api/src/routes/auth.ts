import { FastifyInstance } from 'fastify';
import { prisma } from '../db';
import {
  hashPassword,
  verifyPassword,
  createTokens,
  refreshTokens,
  revokeRefreshToken,
  revokeAllUserTokens,
  createSession,
  revokeSession,
  getUserSessions,
  generateToken,
  generateInviteToken,
} from '../services/auth';
import { authMiddleware } from '../middleware/auth';
import { createRateLimitMiddleware, resetRateLimit } from '../middleware/rateLimit';

interface LoginBody {
  phone: string;
  pin: string;
}

interface RegisterBody {
  phone: string;
  pin: string;
  name: string;
}

interface RefreshBody {
  refreshToken: string;
}

interface LogoutBody {
  refreshToken: string;
}

function setCookies(reply: any, accessToken: string, refreshToken: string) {
  const isProduction = process.env.NODE_ENV === 'production';

  reply.setCookie('access_token', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 15 * 60,
  });

  reply.setCookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  });
}

export async function authRoutes(fastify: FastifyInstance) {
  const rateLimit = createRateLimitMiddleware();

  // Login with phone + PIN
  fastify.post<{ Body: LoginBody }>('/auth/login', { preHandler: rateLimit }, async (request: any, reply: any) => {
    const { phone, pin } = request.body;

    if (!phone || !pin) {
      return reply.status(400).send({ error: 'Telefone e PIN são obrigatórios' });
    }

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return reply.status(400).send({ error: 'PIN deve ter 4 dígitos' });
    }

    const user = await prisma.user.findUnique({ where: { email: phone } });

    if (!user) {
      return reply.status(401).send({ error: 'Credenciais inválidas' });
    }

    const valid = await verifyPassword(user.passwordHash, pin);

    if (!valid) {
      return reply.status(401).send({ error: 'Credenciais inválidas' });
    }

    resetRateLimit(`${request.ip}:${phone}`);

    const tokens = await createTokens(user.id);
    await createSession(user.id, request.headers['user-agent'], request.ip);

    const membership = await prisma.ministryMember.findFirst({
      where: { userId: user.id },
    });

    const accessToken = (request.server as any).jwt.sign({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: membership?.role as any || 'musician',
      ministryId: membership?.ministryId,
    }, { expiresIn: '15m' });

    setCookies(reply, accessToken, tokens.refreshToken);

    return {
      user: { id: user.id, email: user.email, name: user.name, phone: user.email },
    };
  });

  // Login with email + password (admin/operator)
  fastify.post<{ Body: { email: string; password: string } }>('/auth/login/admin', { preHandler: rateLimit }, async (request: any, reply: any) => {
    const { email, password } = request.body;

    if (!email || !password) {
      return reply.status(400).send({ error: 'Email e senha são obrigatórios' });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return reply.status(401).send({ error: 'Credenciais inválidas' });
    }

    const valid = await verifyPassword(user.passwordHash, password);

    if (!valid) {
      return reply.status(401).send({ error: 'Credenciais inválidas' });
    }

    resetRateLimit(`${request.ip}:${email}`);

    const tokens = await createTokens(user.id);
    await createSession(user.id, request.headers['user-agent'], request.ip);

    const membership = await prisma.ministryMember.findFirst({
      where: { userId: user.id },
    });

    const accessToken = (request.server as any).jwt.sign({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: membership?.role as any || 'musician',
      ministryId: membership?.ministryId,
    }, { expiresIn: '15m' });

    setCookies(reply, accessToken, tokens.refreshToken);

    return {
      user: { id: user.id, email: user.email, name: user.name },
    };
  });

  // Register with email + password (first admin only)
  fastify.post<{ Body: { name: string; email: string; password: string } }>('/auth/register/admin', async (request: any, reply: any) => {
    const { name, email, password } = request.body;

    if (!name || !email || !password) {
      return reply.status(400).send({ error: 'Nome, email e senha são obrigatórios' });
    }

    if (password.length < 6) {
      return reply.status(400).send({ error: 'Senha deve ter no mínimo 6 caracteres' });
    }

    const ministryCount = await prisma.ministry.count();

    if (ministryCount > 0) {
      return reply.status(403).send({
        error: 'Registration is closed. Please use an invite link.',
      });
    }

    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      return reply.status(409).send({ error: 'Email já cadastrado' });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: { email, passwordHash, name },
    });

    const ministry = await prisma.ministry.create({
      data: { name: `${name}'s Ministry` },
    });

    await prisma.ministryMember.create({
      data: {
        userId: user.id,
        ministryId: ministry.id,
        role: 'admin',
      },
    });

    const tokens = await createTokens(user.id);
    await createSession(user.id, request.headers['user-agent'], request.ip);

    const accessToken = (request.server as any).jwt.sign({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: 'admin',
      ministryId: ministry.id,
    }, { expiresIn: '15m' });

    setCookies(reply, accessToken, tokens.refreshToken);

    return {
      user: { id: user.id, email: user.email, name: user.name },
      ministry: { id: ministry.id, name: ministry.name, role: 'admin' },
    };
  });

  // Register with phone + PIN (first admin only, legacy)
  fastify.post<{ Body: RegisterBody }>('/auth/register', async (request: any, reply: any) => {
    const { phone, pin, name } = request.body;

    if (!phone || !pin || !name) {
      return reply.status(400).send({ error: 'Telefone, PIN e nome são obrigatórios' });
    }

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return reply.status(400).send({ error: 'PIN deve ter 4 dígitos' });
    }

    const ministryCount = await prisma.ministry.count();

    if (ministryCount > 0) {
      return reply.status(403).send({
        error: 'Registration is closed. Please use an invite link.',
      });
    }

    const existing = await prisma.user.findUnique({ where: { email: phone } });

    if (existing) {
      return reply.status(409).send({ error: 'Telefone já cadastrado' });
    }

    const pinHash = await hashPassword(pin);

    const user = await prisma.user.create({
      data: { email: phone, passwordHash: pinHash, name },
    });

    const ministry = await prisma.ministry.create({
      data: { name: `${name}'s Ministry` },
    });

    await prisma.ministryMember.create({
      data: {
        userId: user.id,
        ministryId: ministry.id,
        role: 'admin',
      },
    });

    const tokens = await createTokens(user.id);
    await createSession(user.id, request.headers['user-agent'], request.ip);

    const accessToken = (request.server as any).jwt.sign({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: 'admin',
      ministryId: ministry.id,
    }, { expiresIn: '15m' });

    setCookies(reply, accessToken, tokens.refreshToken);

    return {
      user: { id: user.id, email: user.email, name: user.name },
      ministry: { id: ministry.id, name: ministry.name, role: 'admin' },
    };
  });

  // Refresh token — aceita body.refreshToken OU cookie refresh_token (para auto-refresh)
  fastify.post<{ Body: RefreshBody }>('/auth/refresh', async (request: any, reply: any) => {
    const refreshToken = request.body?.refreshToken
      || (request.cookies as Record<string, string | undefined>)?.refresh_token;

    if (!refreshToken) {
      return reply.status(400).send({ error: 'Refresh token is required' });
    }

    const tokens = await refreshTokens(refreshToken);

    if (!tokens) {
      return reply.status(401).send({ error: 'Invalid or expired refresh token' });
    }

    const user = await prisma.user.findUnique({ where: { id: tokens.userId } });
    const membership = user ? await prisma.ministryMember.findFirst({ where: { userId: user.id } }) : null;

    const accessToken = (request.server as any).jwt.sign({
      userId: tokens.userId,
      email: user?.email || '',
      name: user?.name || '',
      role: membership?.role as any || 'musician',
      ministryId: membership?.ministryId,
    }, { expiresIn: '15m' });

    setCookies(reply, accessToken, tokens.refreshToken);

    return { success: true };
  });

  // Logout
  fastify.post<{ Body: LogoutBody }>('/auth/logout', async (request: any, reply: any) => {
    const { refreshToken } = request.body;

    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }

    reply.clearCookie('access_token', { path: '/' });
    reply.clearCookie('refresh_token', { path: '/' });

    return { success: true };
  });

  // Get user sessions
  fastify.get('/auth/sessions', { preHandler: [authMiddleware] }, async (request: any) => {
    const user = request.user;
    if (!user) return [];

    const sessions = await getUserSessions(user.id);

    return sessions.map((s: any) => ({
      id: s.id,
      userAgent: s.userAgent,
      ip: s.ip,
      lastActiveAt: s.lastActiveAt,
      createdAt: s.createdAt,
    }));
  });

  // Revoke session
  fastify.delete('/auth/sessions/:sessionId', { preHandler: [authMiddleware] }, async (request: any) => {
    const { sessionId } = request.params;
    await revokeSession(sessionId);
    return { success: true };
  });

  // Get current user
  fastify.get('/auth/me', { preHandler: [authMiddleware] }, async (request: any) => {
    const authUser = request.user;
    if (!authUser) return null;

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: { ministryMembers: true },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      ministries: user.ministryMembers.map((m: any) => ({
        ministryId: m.ministryId,
        role: m.role,
      })),
    };
  });

  // Password reset request
  fastify.post<{ Body: { email: string } }>(
    '/auth/password-reset/request',
    { preHandler: rateLimit },
    async (request: any, reply: any) => {
      const { email } = request.body;

      if (!email) {
        return reply.status(400).send({ error: 'Email is required' });
      }

      const user = await prisma.user.findUnique({ where: { email } });

      if (user) {
    const token = generateInviteToken();
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

        await prisma.passwordResetToken.create({
          data: {
            token,
            userId: user.id,
            expiresAt,
          },
        });

      }

      return { message: 'If an account exists, a reset link was sent.' };
    }
  );

  // Password reset confirm
  fastify.post<{ Body: { token: string; newPassword: string } }>(
    '/auth/password-reset/confirm',
    async (request: any, reply: any) => {
      const { token, newPassword } = request.body;

      if (!token || !newPassword) {
        return reply.status(400).send({ error: 'Token and new password are required' });
      }

      if (newPassword.length < 6) {
        return reply.status(400).send({ error: 'Password must be at least 6 characters' });
      }

      const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });

      if (!resetToken) {
        return reply.status(400).send({ error: 'Invalid token' });
      }

      if (resetToken.usedAt) {
        return reply.status(400).send({ error: 'Token already used' });
      }

      if (resetToken.expiresAt < new Date()) {
        return reply.status(400).send({ error: 'Token expired' });
      }

      const passwordHash = await hashPassword(newPassword);

      await prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      });

      await prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      });

      await revokeAllUserTokens(resetToken.userId);

      return { message: 'Password updated successfully' };
    }
  );

  // Create invite (admin/operator only)
  fastify.post<{
    Body: { phone: string; name: string; role?: string; ministryId?: string };
  }>('/auth/invite', { preHandler: [authMiddleware] }, async (request: any, reply: any) => {
    const { phone, name, role = 'musician', ministryId } = request.body;
    const authUser = request.user;

    if (!authUser) return reply.status(401).send({ error: 'Not authenticated' });

    if (!['admin', 'operator', 'leader'].includes(authUser.role)) {
      return reply.status(403).send({ error: 'Forbidden' });
    }

    const effectiveMinistryId = ministryId || authUser.ministryId;
    if (!effectiveMinistryId) {
      return reply.status(400).send({ error: 'Ministry ID required' });
    }

    if (!phone || !name) {
      return reply.status(400).send({ error: 'Phone and name are required' });
    }

    // Check if phone already has an invite pending
    const existingInvite = await prisma.invite.findFirst({
      where: { phone, usedAt: null, expiresAt: { gte: new Date() } },
    });

    if (existingInvite) {
      return { token: existingInvite.token, expiresAt: existingInvite.expiresAt };
    }

    const token = generateInviteToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invite = await prisma.invite.create({
      data: {
        token,
        phone,
        name,
        role,
        ministryId: effectiveMinistryId,
        expiresAt,
        invitedById: authUser.id,
      },
    });

    return { token: invite.token, expiresAt: invite.expiresAt };
  });

  // List invites for ministry (admin/operator only)
  fastify.get('/auth/invites', { preHandler: [authMiddleware] }, async (request: any) => {
    const authUser = request.user;
    if (!authUser?.ministryId) return [];

    const invites = await prisma.invite.findMany({
      where: { ministryId: authUser.ministryId, usedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    return invites;
  });

  // Revoke invite
  fastify.delete<{ Params: { id: string } }>('/auth/invites/:id', { preHandler: [authMiddleware] }, async (request: any, reply: any) => {
    const authUser = request.user;
    if (!authUser || !['admin', 'operator', 'leader'].includes(authUser.role)) {
      return reply.status(403).send({ error: 'Forbidden' });
    }

    const invite = await prisma.invite.findUnique({
      where: { id: request.params.id },
    });

    if (!invite) {
      return reply.status(404).send({ error: 'Invite not found' });
    }

    if (invite.ministryId !== authUser.ministryId) {
      return reply.status(403).send({ error: 'Forbidden' });
    }

    await prisma.invite.delete({
      where: { id: request.params.id },
    });

    return { success: true };
  });

  // Get invite info (public)
  fastify.get<{
    Params: { token: string };
  }>('/auth/invite/:token', async (request: any, reply: any) => {
    const { token } = request.params;

    const invite = await prisma.invite.findUnique({
      where: { token },
      select: { name: true, phone: true, expiresAt: true, usedAt: true },
    });

    if (!invite) {
      return reply.status(404).send({ error: 'Convite não encontrado' });
    }

    if (invite.usedAt) {
      return reply.status(400).send({ error: 'Convite já utilizado' });
    }

    if (invite.expiresAt < new Date()) {
      return reply.status(400).send({ error: 'Convite expirado' });
    }

    return { name: invite.name, phone: invite.phone };
  });

  // Accept invite (set name + PIN)
  fastify.post<{
    Body: { token: string; name: string; pin: string };
  }>('/auth/invite/accept', async (request: any, reply: any) => {
    try {
      const { token, name, pin } = request.body;

      if (!token || !name || !pin) {
        return reply.status(400).send({ error: 'Token, nome e PIN são obrigatórios' });
      }

      if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
        return reply.status(400).send({ error: 'PIN deve ter 4 dígitos' });
      }

      const invite = await prisma.invite.findUnique({ where: { token } });

      if (!invite) {
        return reply.status(404).send({ error: 'Convite não encontrado' });
      }

      if (invite.usedAt) {
        return reply.status(400).send({ error: 'Convite já utilizado' });
      }

      if (invite.expiresAt < new Date()) {
        return reply.status(400).send({ error: 'Convite expirado' });
      }

      if (!invite.phone) {
        return reply.status(400).send({ error: 'Convite inválido: telefone não informado' });
      }

      const existingUser = await prisma.user.findUnique({
        where: { email: invite.phone },
      });

      if (existingUser) {
        return reply.status(409).send({ error: 'Este telefone já possui cadastro. Faça login.' });
      }

      const pinHash = await hashPassword(pin);

      const user = await prisma.user.create({
        data: {
          email: invite.phone,
          name,
          passwordHash: pinHash,
        },
      });

      await prisma.ministryMember.create({
        data: {
          userId: user.id,
          ministryId: invite.ministryId,
          role: invite.role,
        },
      });

      await prisma.invite.update({
        where: { id: invite.id },
        data: { usedAt: new Date(), usedByUserId: user.id },
      });

      const tokens = await createTokens(user.id);
      await createSession(user.id, request.headers['user-agent'], request.ip);

      const accessToken = (request.server as any).jwt.sign({
        userId: user.id,
        email: user.email,
        name: user.name,
        role: invite.role as any,
        ministryId: invite.ministryId,
      }, { expiresIn: '15m' });

      setCookies(reply, accessToken, tokens.refreshToken);

      return {
        id: user.id,
        email: user.email,
        name: user.name,
      };
    } catch (err: any) {
      request.log.error(err, 'Erro ao aceitar convite');
      return reply.status(500).send({ error: 'Erro interno ao criar conta. Tente novamente.' });
    }
  });
}