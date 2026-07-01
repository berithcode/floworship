import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../db';
import { Role } from './rbac';

export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
  role: Role;
  ministryId?: string;
  exp: number;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  ministryId?: string;
}

export interface AuthRequest extends FastifyRequest {
  user?: AuthenticatedUser;
}

function decodeToken(token: string): TokenPayload | null {
  try {
    const json = Buffer.from(token, 'base64').toString('utf8');
    const payload = JSON.parse(json) as TokenPayload;

    if (payload.exp < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function authMiddleware(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  const cookies = (request as any).cookies as Record<string, string | undefined>;
  const token = cookies?.access_token;

  if (!token) {
    return;
  }

  const payload = decodeToken(token);

  if (!payload) {
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: {
      ministryMembers: {
        where: { role: payload.role || 'musician' },
        take: 1,
      },
    },
  });

  if (!user) {
    return;
  }

  const membership = user.ministryMembers[0];

  (request as AuthRequest).user = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: membership?.role as Role || 'musician',
    ministryId: membership?.ministryId,
  };
}