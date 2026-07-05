import * as argon2 from 'argon2';
import crypto from 'crypto';

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password);
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}

export function generateToken(): string {
  return crypto.randomBytes(64).toString('hex');
}

export function generateInviteToken(): string {
  return crypto.randomBytes(24).toString('hex');
}

export function generateTokens() {
  const accessToken = generateToken();
  const refreshToken = generateToken();
  return { accessToken, refreshToken };
}