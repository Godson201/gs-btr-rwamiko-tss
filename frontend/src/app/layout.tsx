import type { Metadata, Viewport } from 'next';
import { AppInstallProvider } from '@/components/providers/app-install-provider';
import { Toaster } from '@/components/ui/sonner';
import { QueryProvider } from '@/components/providers/query-provider';
import { AuthProvider } from '@/contexts/auth-context';
import { LanguageProvider } from '@/contexts/language-context';
import './globals.css';

export const metadata: Metadata = {
  applicationName: 'BTR Rwamiko TSS',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'BTR Rwamiko', statusBarStyle: 'default' },
  icons: {
    icon: [{ url: '/app-icons/icon-32-v2.png', sizes: '32x32', type: 'image/png' }, { url: '/app-icons/icon-192-v2.png', sizes: '192x192', type: 'image/png' }],
    apple: [{ url: '/app-icons/icon-180-v2.png', sizes: '180x180', type: 'image/png' }],
  },
  title: {
    default: 'G.S BTR RWAMIKO TSS',
    template: '%s | G.S BTR RWAMIKO TSS',
  },
  description:
    'Official website and school management system for G.S BTR RWAMIKO TSS — "Through Here, Wealth is Flash".',
};

export const viewport: Viewport = { themeColor: '#0b1831', width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <QueryProvider>
          <AppInstallProvider><LanguageProvider><AuthProvider>
            {children}
            <Toaster richColors position="top-right" />
          </AuthProvider></LanguageProvider></AppInstallProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
