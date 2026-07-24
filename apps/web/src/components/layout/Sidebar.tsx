'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface SidebarItem {
  label: string;
  href: string;
}

export interface SidebarProps {
  items: SidebarItem[];
}

export function Sidebar({ items }: SidebarProps) {
  const pathname = usePathname();

  return (
    <nav className="qd-root w-[200px] shrink-0 border-r border-qd-neutral-200 bg-white p-3">
      <ul className="flex flex-col gap-0.5">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`block rounded-qd-md px-3 py-1.5 text-sm ${
                  active ? 'bg-qd-primary-50 font-medium text-qd-primary-600' : 'text-qd-neutral-600 hover:bg-qd-neutral-100'
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
