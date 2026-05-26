import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

const SECRET = process.env.JWT_SECRET || 'chave_secreta_padrao_para_desenvolvimento';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'chave_secreta_refresh_padrao';

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// Token de acesso agora dura pouco tempo (15 minutos)
export function signToken(payload: object): string {
  return jwt.sign(payload, SECRET, { expiresIn: '15m' });
}

export function verifyToken(token: string) {
  return jwt.verify(token, SECRET);
}

// Token de renovação dura mais tempo (7 dias)
export function signRefreshToken(payload: object): string {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, REFRESH_SECRET);
}