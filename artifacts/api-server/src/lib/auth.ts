import jwt from 'jsonwebtoken';

const SECRET = process.env['SESSION_SECRET'];
if (!SECRET) throw new Error('SESSION_SECRET is required');

export const COOKIE_NAME = '4bor_token';
export const COOKIE_MAX_AGE = 7 * 24 * 3600 * 1000; // 7 days ms

export interface JwtPayload {
  sub:   number;
  login: string;
  role:  string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, SECRET!, { expiresIn: '7d' });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, SECRET!) as JwtPayload;
  } catch {
    return null;
  }
}
