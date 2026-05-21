import crypto from 'crypto';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export function generateInviteCode(): string {
  let code = '';
  const bytes = crypto.randomBytes(8);
  for (const byte of bytes) {
    code += CHARS[byte % CHARS.length];
  }
  return code;
}
