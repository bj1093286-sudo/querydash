import { Hono } from 'hono';
import { AuthError, signup, login, getUserById, listUsers, resetPassword } from '../services/authService';
import type { AuthEnv } from '../middleware/auth';

export const authRoutes = new Hono<AuthEnv>();

function authErrorStatus(code: AuthError['code']): 400 | 401 | 403 {
  if (code === 'INVALID_CREDENTIALS') return 401;
  if (code === 'FORBIDDEN') return 403;
  return 400;
}

authRoutes.post('/signup', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { email, password, name } = body;
  if (!email || !password || !name) {
    return c.json({ error: { code: 'UNKNOWN', message: '이메일, 비밀번호, 이름을 모두 입력해주세요.' } }, 400);
  }
  if (String(password).length < 8) {
    return c.json({ error: { code: 'UNKNOWN', message: '비밀번호는 8자 이상이어야 합니다.' } }, 400);
  }
  try {
    const { user, token } = await signup(email, password, name);
    return c.json({ user, token }, 201);
  } catch (e) {
    if (e instanceof AuthError) {
      return c.json({ error: { code: 'UNKNOWN', message: e.message } }, authErrorStatus(e.code));
    }
    throw e;
  }
});

authRoutes.post('/login', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { email, password } = body;
  if (!email || !password) {
    return c.json({ error: { code: 'UNKNOWN', message: '이메일과 비밀번호를 입력해주세요.' } }, 400);
  }
  try {
    const { user, token } = await login(email, password);
    return c.json({ user, token });
  } catch (e) {
    if (e instanceof AuthError) {
      return c.json({ error: { code: 'UNKNOWN', message: e.message } }, authErrorStatus(e.code));
    }
    throw e;
  }
});

authRoutes.get('/me', async (c) => {
  const auth = c.get('authUser');
  if (!auth) return c.json({ error: { code: 'UNKNOWN', message: '인증이 필요합니다.' } }, 401);
  const user = await getUserById(auth.sub);
  if (!user) return c.json({ error: { code: 'NOT_FOUND', message: '사용자를 찾을 수 없습니다.' } }, 404);
  return c.json(user);
});

authRoutes.get('/users', async (c) => {
  const auth = c.get('authUser');
  if (!auth || auth.role !== 'admin') {
    return c.json({ error: { code: 'UNKNOWN', message: '관리자만 접근할 수 있습니다.' } }, 403);
  }
  return c.json(await listUsers());
});

authRoutes.post('/reset-password', async (c) => {
  const auth = c.get('authUser');
  if (!auth) return c.json({ error: { code: 'UNKNOWN', message: '인증이 필요합니다.' } }, 401);
  const body = await c.req.json().catch(() => ({}));
  const { userId, newPassword } = body;
  if (!userId || !newPassword || String(newPassword).length < 8) {
    return c.json({ error: { code: 'UNKNOWN', message: '새 비밀번호는 8자 이상이어야 합니다.' } }, 400);
  }
  try {
    await resetPassword(auth.sub, userId, newPassword);
    return c.body(null, 204);
  } catch (e) {
    if (e instanceof AuthError) {
      return c.json({ error: { code: 'UNKNOWN', message: e.message } }, authErrorStatus(e.code));
    }
    throw e;
  }
});
