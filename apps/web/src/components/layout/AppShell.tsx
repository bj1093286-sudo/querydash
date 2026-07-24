'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from './Navbar';
import { AuthGate } from './AuthGate';

const PUBLIC_PATHS = new Set(['/login', '/signup']);

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname && PUBLIC_PATHS.has(pathname)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-qd-neutral-50 p-4">{children}</div>
    );
  }

  return (
    <AuthGate>
      <div className="flex h-screen min-w-0 flex-col bg-qd-neutral-50">
        <Navbar />
        <main className="flex min-w-0 flex-1 overflow-hidden">{children}</main>
      </div>
    </AuthGate>
  );
}
