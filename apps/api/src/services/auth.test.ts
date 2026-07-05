import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, generateToken } from './auth/utils';

describe('Auth Service', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'testpassword123';
      const hash = await hashPassword(password);
      expect(hash).toBeTruthy();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);
    });

    it('should generate different hashes for same password', async () => {
      const password = 'testpassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      expect(hash1).not.toBe(hash2); // salt ensures uniqueness
    });
  });

  describe('verifyPassword', () => {
    it('should return true for correct password', async () => {
      const password = 'testpassword123';
      const hash = await hashPassword(password);
      const result = await verifyPassword(hash, password);
      expect(result).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const password = 'testpassword123';
      const hash = await hashPassword(password);
      const result = await verifyPassword(hash, 'wrongpassword');
      expect(result).toBe(false);
    });
  });

  describe('generateToken', () => {
    it('should generate a random token', () => {
      const token1 = generateToken();
      const token2 = generateToken();
      expect(token1).toBeTruthy();
      expect(token1.length).toBe(128); // 64 bytes in hex
      expect(token1).not.toBe(token2);
    });
  });
});