import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

function secret() {
  return process.env.TOKEN_SECRET || 'change-me';
}

export function generateToken(username) {
  const expiry = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
  const payload = `${username}.${expiry}`;
  const sig = crypto.createHmac('sha256', secret()).update(payload).digest('hex');
  return Buffer.from(`${payload}.${sig}`).toString('base64url');
}

export function verifyToken(token) {
  try {
    const decoded = Buffer.from(token, 'base64url').toString();
    const lastDot = decoded.lastIndexOf('.');
    const payload = decoded.slice(0, lastDot);
    const sig = decoded.slice(lastDot + 1);
    const dotIdx = payload.indexOf('.');
    const username = payload.slice(0, dotIdx);
    const expiry = parseInt(payload.slice(dotIdx + 1));
    if (isNaN(expiry) || Date.now() > expiry) return null;
    const expected = crypto.createHmac('sha256', secret()).update(payload).digest('hex');
    if (sig !== expected) return null;
    return username;
  } catch (e) { return null; }
}

export function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}
