import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/sonner';
import { QueryProvider } from '@/components/providers/query-provider';
import { AuthProvider } from '@/contexts/auth-context';
import { LanguageProvider } from '@/contexts/language-context';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'G.S BTR RWAMIKO TSS',
    template: '%s | G.S BTR RWAMIKO TSS',
  },
  description:
    'Official website and school management system for G.S BTR RWAMIKO TSS — "Through Here, Wealth is Flash".',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <QueryProvider>
          <LanguageProvider><AuthProvider>
            {children}
            <Toaster richColors position="top-right" />
          </AuthProvider></LanguageProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
