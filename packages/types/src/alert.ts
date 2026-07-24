export type AlertOp = 'greater' | 'less' | 'equals';
export type AlertState = 'ok' | 'triggered' | 'unknown';

export interface AlertSchedule {
  enabled: boolean;
  intervalMinutes?: number;
}

export interface Alert {
  id: string;
  name: string;
  queryId: string;
  queryName?: string;
  column: string;
  op: AlertOp;
  value: number;
  state: AlertState;
  schedule?: AlertSchedule;
  lastCheckedAt?: string;
  lastValue?: number;
  createdBy: string;
  createdAt: string;
}
