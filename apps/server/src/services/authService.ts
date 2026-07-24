import { eq, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db, schema } from '../db';

const ALLOWED_DOMAIN = '@onhouse.com';
const JWT_EXPIRES_IN = '30d';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
}

export interface AuthTokenPayload {
  sub: string;
  email: string;
  name: string;
  role: AuthUser['role'];
}

class AuthError extends Error {
  constructor(
    public readonly code: 'INVALID_DOMAIN' | 'EMAIL_TAKEN' | 'INVALID_CREDENTIALS' | 'FORBIDDEN',
    message: string
  ) {
    super(message);
  }
}

export { AuthError };

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET 환경변수가 설정되어 있지 않습니다.');
  return secret;
}

function toAuthUser(row: typeof schema.users.$inferSelect): AuthUser {
  return { id: row.id, email: row.email, name: row.name, role: row.role };
}

export function issueToken(user: AuthUser): string {
  const payload: AuthTokenPayload = { sub: user.id, email: user.email, name: user.name, role: user.role };
  return jwt.sign(payload, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): AuthTokenPayload {
  return jwt.verify(token, getJwtSecret()) as AuthTokenPayload;
}

export async function signup(email: string, password: string, name: string): Promise<{ user: AuthUser; token: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail.endsWith(ALLOWED_DOMAIN)) {
    throw new AuthError('INVALID_DOMAIN', `${ALLOWED_DOMAIN} 이메일만 가입할 수 있습니다.`);
  }

  const [existing] = await db.select().from(schema.users).where(eq(schema.users.email, normalizedEmail));
  if (existing) {
    throw new AuthError('EMAIL_TAKEN', '이미 가입된 이메일입니다.');
  }

  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(schema.users);
  const role: AuthUser['role'] = count === 0 ? 'admin' : 'editor';

  const passwordHash = await bcrypt.hash(password, 10);
  const [row] = await db
    .insert(schema.users)
    .values({ email: normalizedEmail, name, passwordHash, role })
    .returning();

  const user = toAuthUser(row);
  return { user, token: issueToken(user) };
}

export async function login(email: string, password: string): Promise<{ user: AuthUser; token: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  const [row] = await db.select().from(schema.users).where(eq(schema.users.email, normalizedEmail));
  if (!row) {
    throw new AuthError('INVALID_CREDENTIALS', '이메일 또는 비밀번호가 올바르지 않습니다.');
  }
  const valid = await bcrypt.compare(password, row.passwordHash);
  if (!valid) {
    throw new AuthError('INVALID_CREDENTIALS', '이메일 또는 비밀번호가 올바르지 않습니다.');
  }
  const user = toAuthUser(row);
  return { user, token: issueToken(user) };
}

export async function getUserById(id: string): Promise<AuthUser | undefined> {
  const [row] = await db.select().from(schema.users).where(eq(schema.users.id, id));
  return row ? toAuthUser(row) : undefined;
}

export async function listUsers(): Promise<AuthUser[]> {
  const rows = await db.select().from(schema.users);
  return rows.map(toAuthUser);
}

export async function resetPassword(requesterId: string, targetUserId: string, newPassword: string): Promise<void> {
  const requester = await getUserById(requesterId);
  if (!requester || requester.role !== 'admin') {
    throw new AuthError('FORBIDDEN', '관리자만 비밀번호를 초기화할 수 있습니다.');
  }
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await db.update(schema.users).set({ passwordHash, updatedAt: new Date() }).where(eq(schema.users.id, targetUserId));
}
