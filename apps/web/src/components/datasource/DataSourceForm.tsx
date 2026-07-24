'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Dropdown } from '@querydash/ui';
import type { DataSourceType } from '@querydash/types';
import { api } from '../../lib/api';

const TYPE_OPTIONS: Array<{ label: string; value: DataSourceType }> = [
  { label: 'PostgreSQL', value: 'postgresql' },
  { label: 'MySQL', value: 'mysql' },
];

const DEFAULT_PORTS: Record<string, string> = {
  postgresql: '5432',
  mysql: '3306',
};

export function DataSourceForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [type, setType] = useState<DataSourceType>('postgresql');
  const [host, setHost] = useState('localhost');
  const [port, setPort] = useState(DEFAULT_PORTS.postgresql);
  const [database, setDatabase] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [readOnly, setReadOnly] = useState(false);
  const [ssl, setSsl] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  function handleTypeChange(value: string) {
    const nextType = value as DataSourceType;
    setType(nextType);
    setPort(DEFAULT_PORTS[nextType] ?? port);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(undefined);
    try {
      await api.datasources.create({
        name,
        type,
        connectionOptions: { host, port: Number(port), database, username, password, ssl },
        readOnly,
      });
      router.push('/datasources');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '데이터소스 생성에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-md flex-col gap-3">
      <label className="text-sm font-medium text-qd-neutral-700">
        이름
        <Input value={name} onChange={(e) => setName(e.target.value)} required className="mt-1" />
      </label>
      <label className="text-sm font-medium text-qd-neutral-700">
        데이터소스 종류
        <Dropdown value={type} options={TYPE_OPTIONS} onChange={handleTypeChange} className="mt-1 w-full" />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm font-medium text-qd-neutral-700">
          호스트
          <Input value={host} onChange={(e) => setHost(e.target.value)} required className="mt-1" />
        </label>
        <label className="text-sm font-medium text-qd-neutral-700">
          포트
          <Input value={port} onChange={(e) => setPort(e.target.value)} required className="mt-1" />
        </label>
      </div>
      <label className="text-sm font-medium text-qd-neutral-700">
        데이터베이스
        <Input value={database} onChange={(e) => setDatabase(e.target.value)} required className="mt-1" />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm font-medium text-qd-neutral-700">
          사용자명
          <Input value={username} onChange={(e) => setUsername(e.target.value)} className="mt-1" />
        </label>
        <label className="text-sm font-medium text-qd-neutral-700">
          비밀번호
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm text-qd-neutral-700">
        <input type="checkbox" checked={ssl} onChange={(e) => setSsl(e.target.checked)} />
        SSL 사용 (Neon, Supabase, PlanetScale 등 대부분의 클라우드 DB에 필요)
      </label>
      <label className="flex items-center gap-2 text-sm text-qd-neutral-700">
        <input type="checkbox" checked={readOnly} onChange={(e) => setReadOnly(e.target.checked)} />
        읽기 전용 (SELECT/WITH만 허용)
      </label>
      {error && <p className="text-sm text-qd-error">{error}</p>}
      <Button type="submit" loading={submitting}>
        데이터소스 생성
      </Button>
    </form>
  );
}
