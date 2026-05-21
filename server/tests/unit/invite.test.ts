import { describe, it, expect } from 'vitest';
import { generateInviteCode } from '../../src/lib/inviteCode';

describe('generateInviteCode', () => {
  it('returns a string of length 8', () => {
    const code = generateInviteCode();
    expect(code).toHaveLength(8);
  });

  it('only contains alphanumeric characters (A-Z, 0-9)', () => {
    const code = generateInviteCode();
    expect(/^[A-Z0-9]{8}$/.test(code)).toBe(true);
  });

  it('generates unique codes', () => {
    const a = generateInviteCode();
    const b = generateInviteCode();
    expect(a).not.toBe(b);
  });
});
