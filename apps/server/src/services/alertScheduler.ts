import { listAlerts, checkAlert } from './alertService';

const TICK_MS = 60_000;
let ticking = false;

async function tick() {
  if (ticking) return;
  ticking = true;
  try {
    const alerts = await listAlerts();
    for (const alert of alerts) {
      if (!alert.schedule?.enabled) continue;
      const intervalMs = (alert.schedule.intervalMinutes ?? 60) * 60_000;
      const lastChecked = alert.lastCheckedAt ? new Date(alert.lastCheckedAt).getTime() : 0;
      if (Date.now() - lastChecked < intervalMs) continue;
      await checkAlert(alert.id).catch((e) => console.error(`알림 확인 실패 (${alert.id}):`, e));
    }
  } finally {
    ticking = false;
  }
}

export function startAlertScheduler(): void {
  setInterval(() => void tick(), TICK_MS).unref();
}
