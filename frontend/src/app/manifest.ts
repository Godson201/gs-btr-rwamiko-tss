import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'BTR Rwamiko TSS',
    short_name: 'BTR Rwamiko',
    description: 'Your school, within reach. Learning, progress, messages and school updates at BTR Rwamiko TSS.',
    start_url: '/auth/login?source=app',
    scope: '/',
    display: 'standalone',
    background_color: '#0b1831',
    theme_color: '#0b1831',
    lang: 'en',
    categories: ['education', 'productivity'],
    icons: [
      { src: '/app-icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/app-icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/app-icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'School portal', url: '/auth/login', description: 'Open your school account' },
      { name: 'School updates', url: '/#school-updates', description: 'See the latest public announcements' },
    ],
  };
}
