'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@querydash/ui';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

export default function SignupPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(undefined);
    try {
      const { user, token } = await api.auth.signup({ email, password, name });
      setSession(user, token);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : '회원가입에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-sm rounded-qd-lg border border-qd-neutral-200 bg-white p-6 shadow-qd-card">
      <h1 className="mb-1 text-lg font-semibold text-qd-neutral-800">QueryDash 회원가입</h1>
      <p className="mb-5 text-sm text-qd-neutral-500">
        @onhouse.com 이메일만 가입할 수 있습니다. 가장 먼저 가입하는 사용자가 관리자가 됩니다.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="text-sm font-medium text-qd-neutral-700">
          이름
          <Input value={name} onChange={(e) => setName(e.target.value)} required className="mt-1" />
        </label>
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
            minLength={8}
            className="mt-1"
          />
          <span className="mt-1 block text-xs font-normal text-qd-neutral-400">8자 이상 입력하세요.</span>
        </label>
        {error && <p className="text-sm text-qd-error">{error}</p>}
        <Button type="submit" loading={submitting}>
          회원가입
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-qd-neutral-500">
        이미 계정이 있으신가요?{' '}
        <Link href="/login" className="text-qd-primary-600 hover:underline">
          로그인
        </Link>
      </p>
    </div>
  );
}
