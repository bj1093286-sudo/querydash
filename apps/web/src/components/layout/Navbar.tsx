'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Dropdown } from '@querydash/ui';
import { useAuthStore } from '../../store/authStore';

const NAV_ITEMS = [
  { label: '쿼리', href: '/queries' },
  { label: '대시보드', href: '/dashboards' },
  { label: '알림', href: '/alerts' },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function handleLogout() {
    logout();
    router.push('/login');
  }

  return (
    <header className="qd-root flex h-[50px] min-w-0 items-center gap-3 border-b border-qd-neutral-200 bg-white px-3 sm:gap-4 sm:px-4">
      <Link href="/" className="shrink-0 text-base font-semibold text-qd-primary-600">
        QueryDash
      </Link>
      <input
        type="search"
        placeholder="쿼리, 대시보드 검색..."
        className="hidden w-64 min-w-0 rounded-qd-md border border-qd-neutral-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-qd-primary-200 md:block"
      />
      <nav className="flex min-w-0 flex-1 items-center justify-center gap-1 overflow-x-auto">
        {NAV_ITEMS.map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 rounded-qd-md px-2.5 py-1.5 text-sm font-medium sm:px-3 ${
                active ? 'bg-qd-primary-50 text-qd-primary-600' : 'text-qd-neutral-600 hover:bg-qd-neutral-100'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <Dropdown
          placeholder="+ 생성"
          options={[
            { label: '새 쿼리', value: '/queries/new' },
            { label: '새 대시보드', value: '/dashboards/new' },
            { label: '새 데이터소스', value: '/datasources/new' },
          ]}
          onChange={(value) => {
            window.location.href = value;
          }}
        />
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-qd-full bg-qd-primary-100 text-xs font-semibold text-qd-primary-700"
            title={user?.name}
          >
            {user?.name?.slice(0, 1).toUpperCase() ?? '?'}
          </button>
          {menuOpen && (
            <div className="absolute right-0 z-30 mt-1 w-52 rounded-qd-md border border-qd-neutral-200 bg-white py-1 shadow-qd-md">
              <div className="border-b border-qd-neutral-100 px-3 py-2">
                <div className="truncate text-sm font-medium text-qd-neutral-800">{user?.name}</div>
                <div className="truncate text-xs text-qd-neutral-500">{user?.email}</div>
                <div className="mt-0.5 text-xs text-qd-neutral-400">
                  {user?.role === 'admin' ? '관리자' : user?.role === 'editor' ? '편집자' : '뷰어'}
                </div>
              </div>
              {user?.role === 'admin' && (
                <Link
                  href="/settings"
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-1.5 text-sm text-qd-neutral-700 hover:bg-qd-neutral-50"
                >
                  설정
                </Link>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="block w-full px-3 py-1.5 text-left text-sm text-qd-error hover:bg-red-50"
              >
                로그아웃
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
