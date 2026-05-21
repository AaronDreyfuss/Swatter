import { Resend } from 'resend';

// SDK throws at instantiation without a key. Use a placeholder in non-production
// environments so test files that don't mock this module don't crash on import.
const resend = new Resend(process.env.RESEND_API_KEY ?? 'placeholder');

export default resend;
