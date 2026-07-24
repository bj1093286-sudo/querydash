import { createMiddleware } from 'hono/factory';
import { verifyToken, type AuthTokenPayload } from '../services/authService';

export interface AuthEnv {
  Variables: {
    authUser?: AuthTokenPayload;
  };
}

export const authMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
  const header = c.req.header('Authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
  if (token) {
    try {
      c.set('authUser', verifyToken(token));
    } catch {
      // invalid/expired token - leave authUser unset; requireAuth rejects downstream
    }
  }
  await next();
});

export const requireAuth = createMiddleware<AuthEnv>(async (c, next) => {
  if (!c.get('authUser')) {
    return c.json({ error: { code: 'UNKNOWN', message: '인증이 필요합니다.' } }, 401);
  }
  await next();
});

export const requireAdmin = createMiddleware<AuthEnv>(async (c, next) => {
  const user = c.get('authUser');
  if (!user || user.role !== 'admin') {
    return c.json({ error: { code: 'UNKNOWN', message: '관리자만 접근할 수 있습니다.' } }, 403);
  }
  await next();
});
