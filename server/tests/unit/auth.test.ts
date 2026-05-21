import { describe, it, expect } from 'vitest';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'test_secret';

describe('bcrypt', () => {
  it('hashes a password', async () => {
    const hash = await bcrypt.hash('password123', 10);
    expect(typeof hash).toBe('string');
    expect(hash).not.toBe('password123');
  });

  it('validates a correct password', async () => {
    const hash = await bcrypt.hash('password123', 10);
    const match = await bcrypt.compare('password123', hash);
    expect(match).toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const hash = await bcrypt.hash('password123', 10);
    const match = await bcrypt.compare('wrongpassword', hash);
    expect(match).toBe(false);
  });
});

describe('JWT', () => {
  it('signs and returns a string token', () => {
    const token = jwt.sign({ id: 'user-1' }, JWT_SECRET);
    expect(typeof token).toBe('string');
  });

  it('verifies a valid token and returns the correct payload', () => {
    const token = jwt.sign({ id: 'user-1' }, JWT_SECRET);
    const payload = jwt.verify(token, JWT_SECRET) as { id: string };
    expect(payload.id).toBe('user-1');
  });

  it('throws on a tampered token', () => {
    const token = jwt.sign({ id: 'user-1' }, JWT_SECRET);
    const tampered = token.slice(0, -5) + 'xxxxx';
    expect(() => jwt.verify(tampered, JWT_SECRET)).toThrow();
  });

  it('throws on an expired token', () => {
    const token = jwt.sign({ id: 'user-1' }, JWT_SECRET, { expiresIn: '0s' });
    expect(() => jwt.verify(token, JWT_SECRET)).toThrow();
  });
});
