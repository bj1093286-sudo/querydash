'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@querydash/ui';
import { api } from '../../../lib/api';

export default function NewDashboardPage() {
  const router = useRouter();
  const [name, setName] = useState('새 대시보드');
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const dashboard = await api.dashboards.create({ name: name.trim() });
      router.push(`/dashboards/${dashboard.id}`);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <h1 className="mb-4 text-xl font-semibold text-qd-neutral-800">새 대시보드</h1>
      <div className="max-w-md space-y-3 rounded-qd-md border border-qd-neutral-200 bg-white p-5">
        <label className="block text-sm font-medium text-qd-neutral-700">대시보드 이름</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="대시보드 이름" />
        <Button variant="primary" onClick={handleCreate} loading={creating} disabled={!name.trim()}>
          생성
        </Button>
      </div>
    </div>
  );
}
