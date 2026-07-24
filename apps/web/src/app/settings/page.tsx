'use client';

import { useEffect, useState } from 'react';
import { Button, Input, Dropdown } from '@querydash/ui';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import type { AuthUser } from '../../store/authStore';

export default function SettingsPage() {
  const currentUser = useAuthStore((s) => s.user);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [targetUserId, setTargetUserId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (currentUser?.role !== 'admin') return;
    api
      .auth.users()
      .then(setUsers)
      .finally(() => setLoading(false));
  }, [currentUser]);

  if (currentUser && currentUser.role !== 'admin') {
    return (
      <div className="flex-1 overflow-auto p-6">
        <p className="text-sm text-qd-neutral-500">관리자만 접근할 수 있는 페이지입니다.</p>
      </div>
    );
  }

  async function handleResetPassword() {
    if (!targetUserId || newPassword.length < 8) return;
    setSubmitting(true);
    setError(undefined);
    setMessage(undefined);
    try {
      await api.auth.resetPassword({ userId: targetUserId, newPassword });
      setMessage('비밀번호가 초기화되었습니다.');
      setNewPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '비밀번호 초기화에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  const roleLabel = (role: AuthUser['role']) => (role === 'admin' ? '관리자' : role === 'editor' ? '편집자' : '뷰어');

  return (
    <div className="flex-1 overflow-auto p-6">
      <h1 className="mb-4 text-xl font-semibold text-qd-neutral-800">설정</h1>

      <section className="mb-6 max-w-2xl rounded-qd-md border border-qd-neutral-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-qd-neutral-700">사용자 목록</h2>
        {loading ? (
          <p className="text-sm text-qd-neutral-400">불러오는 중...</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-qd-neutral-500">
              <tr>
                <th className="pb-2 font-medium">이름</th>
                <th className="pb-2 font-medium">이메일</th>
                <th className="pb-2 font-medium">역할</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-qd-neutral-100">
                  <td className="py-1.5 text-qd-neutral-800">{u.name}</td>
                  <td className="py-1.5 text-qd-neutral-600">{u.email}</td>
                  <td className="py-1.5 text-qd-neutral-600">{roleLabel(u.role)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="max-w-md rounded-qd-md border border-qd-neutral-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-qd-neutral-700">비밀번호 초기화</h2>
        <div className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-qd-neutral-600">대상 사용자</label>
            <Dropdown
              value={targetUserId}
              options={users.map((u) => ({ label: `${u.name} (${u.email})`, value: u.id }))}
              onChange={setTargetUserId}
              placeholder="사용자 선택"
              className="w-full"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-qd-neutral-600">새 비밀번호</label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              placeholder="8자 이상"
            />
          </div>
          {error && <p className="text-sm text-qd-error">{error}</p>}
          {message && <p className="text-sm text-qd-success">{message}</p>}
          <Button
            variant="primary"
            onClick={handleResetPassword}
            loading={submitting}
            disabled={!targetUserId || newPassword.length < 8}
          >
            비밀번호 초기화
          </Button>
        </div>
      </section>
    </div>
  );
}
