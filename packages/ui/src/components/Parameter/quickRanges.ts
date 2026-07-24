export type QuickRangeKey =
  | 'today'
  | 'yesterday'
  | 'last_7_days'
  | 'last_30_days'
  | 'this_month'
  | 'last_month'
  | 'custom';

export interface DateRangeValue {
  start: string;
  end: string;
}

// Local-calendar-date formatting; toISOString() would shift the date across
// midnight for any timezone ahead of UTC, so this avoids that off-by-one.
function fmt(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function computeQuickRange(key: QuickRangeKey): DateRangeValue | undefined {
  const today = startOfDay(new Date());

  switch (key) {
    case 'today':
      return { start: fmt(today), end: fmt(today) };
    case 'yesterday': {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      return { start: fmt(y), end: fmt(y) };
    }
    case 'last_7_days': {
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      return { start: fmt(start), end: fmt(today) };
    }
    case 'last_30_days': {
      const start = new Date(today);
      start.setDate(start.getDate() - 29);
      return { start: fmt(start), end: fmt(today) };
    }
    case 'this_month': {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { start: fmt(start), end: fmt(today) };
    }
    case 'last_month': {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      return { start: fmt(start), end: fmt(end) };
    }
    case 'custom':
    default:
      return undefined;
  }
}

export const QUICK_RANGE_OPTIONS: Array<{ key: QuickRangeKey; label: string }> = [
  { key: 'today', label: '오늘' },
  { key: 'yesterday', label: '어제' },
  { key: 'last_7_days', label: '최근 7일' },
  { key: 'last_30_days', label: '최근 30일' },
  { key: 'this_month', label: '이번 달' },
  { key: 'last_month', label: '지난 달' },
  { key: 'custom', label: '직접 입력' },
];
