'use client';

import { useEffect, useState } from 'react';
import { Modal, Button } from '@querydash/ui';
import type { QueryVersion } from '@querydash/types';
import { api } from '../../lib/api';

export interface QueryVersionHistoryModalProps {
  open: boolean;
  queryId: string;
  onClose: () => void;
  onReverted: (sqlText: string) => void;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function QueryVersionHistoryModal({ open, queryId, onClose, onReverted }: QueryVersionHistoryModalProps) {
  const [versions, setVersions] = useState<QueryVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [revertingId, setRevertingId] = useState<string>();

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api.queries
      .listVersions(queryId)
      .then(setVersions)
      .finally(() => setLoading(false));
  }, [open, queryId]);

  async function handleRevert(versionId: string) {
    setRevertingId(versionId);
    try {
      const updated = await api.queries.revertToVersion(queryId, versionId);
      onReverted(updated.sqlText);
      onClose();
    } finally {
      setRevertingId(undefined);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="버전 기록" width={560}>
      {loading ? (
        <p className="text-sm text-qd-neutral-400">불러오는 중...</p>
      ) : versions.length === 0 ? (
        <p className="text-sm text-qd-neutral-400">저장된 이전 버전이 없습니다. SQL을 수정하고 저장할 때마다 이전 버전이 자동으로 기록됩니다.</p>
      ) : (
        <div className="max-h-96 space-y-2 overflow-y-auto">
          {versions.map((v) => (
            <div key={v.id} className="rounded-qd-md border border-qd-neutral-200 p-2.5">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-xs text-qd-neutral-500">{formatDateTime(v.createdAt)}</span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleRevert(v.id)}
                  loading={revertingId === v.id}
                >
                  되돌리기
                </Button>
              </div>
              <pre className="max-h-24 overflow-auto whitespace-pre-wrap break-all rounded-qd-sm bg-qd-neutral-50 p-2 font-mono text-xs text-qd-neutral-700">
                {v.sqlText}
              </pre>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
