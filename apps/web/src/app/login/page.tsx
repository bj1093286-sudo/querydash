'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@querydash/ui';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(undefined);
    try {
      const { user, token } = await api.auth.login({ email, password });
      setSession(user, token);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-sm rounded-qd-lg border border-qd-neutral-200 bg-white p-6 shadow-qd-card">
      <h1 className="mb-1 text-lg font-semibold text-qd-neutral-800">QueryDash 로그인</h1>
      <p className="mb-5 text-sm text-qd-neutral-500">@onhouse.com 이메일로 로그인하세요.</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="text-sm font-medium text-qd-neutral-700">
          이메일
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@onhouse.com"
            required
            className="mt-1"
          />
        </label>
        <label className="text-sm font-medium text-qd-neutral-700">
          비밀번호
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1"
          />
        </label>
        {error && <p className="text-sm text-qd-error">{error}</p>}
        <Button type="submit" loading={submitting}>
          로그인
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-qd-neutral-500">
        계정이 없으신가요?{' '}
        <Link href="/signup" className="text-qd-primary-600 hover:underline">
          회원가입
        </Link>
      </p>
    </div>
  );
}
