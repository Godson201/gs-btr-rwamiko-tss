// src/components/layout/Header.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Header() {
  const pathname = usePathname();
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-sm font-bold text-blue-900">G.S BTR RWAMIKO TSS</span>
        </Link>
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/" className="text-sm font-medium hover:text-blue-900">Home</Link>
          <Link href="/about" className="text-sm font-medium hover:text-blue-900">About</Link>
          <Link href="/academics" className="text-sm font-medium hover:text-blue-900">Academics</Link>
          <Link href="/tvet" className="text-sm font-medium hover:text-blue-900">TVET</Link>
          <Link href="/contact" className="text-sm font-medium hover:text-blue-900">Contact</Link>
        </nav>
      </div>
    </header>
  );
}
