import type { Metadata } from 'next';
import '@querydash/ui/styles.css';
import './globals.css';
import { AppShell } from '../components/layout/AppShell';

export const metadata: Metadata = {
  title: 'QueryDash',
  description: 'SQL 기반 데이터 시각화 대시보드',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
