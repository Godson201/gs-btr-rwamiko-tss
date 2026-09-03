// src/components/layout/Header.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SchoolBrand } from '@/components/shared/school-brand';

export function Header() {
  const pathname = usePathname();
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" aria-label="G.S BTR RWAMIKO TSS home">
          <SchoolBrand compact />
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
