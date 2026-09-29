'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppInstall } from '@/components/providers/app-install-provider';

export function AppInstallPanel() {
  const { available, installed, install } = useAppInstall();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function handleInstall() {
    setBusy(true);
    const result = await install();
    setMessage(result === 'accepted' ? 'Installation requested. Follow your device’s prompt to finish.'
      : result === 'dismissed' ? 'You can install later using your browser menu.'
      : 'Use the installation steps below for your device.');
    setBusy(false);
  }
  return <div className="mt-8 space-y-3" data-no-translate>
    <div className="flex flex-wrap gap-3">
      {installed ? <Button asChild size="lg" className="min-h-12 rounded-xl bg-cyan-300 font-bold text-slate-950 hover:bg-cyan-200"><Link href="/auth/login">Open school portal <ArrowRight /></Link></Button>
        : available ? <Button size="lg" disabled={busy} onClick={handleInstall} className="min-h-12 rounded-xl bg-cyan-300 font-bold text-slate-950 hover:bg-cyan-200"><Download />{busy ? 'Opening installer…' : 'Install BTR Rwamiko'}</Button>
          : <Button asChild size="lg" className="min-h-12 rounded-xl bg-cyan-300 font-bold text-slate-950 hover:bg-cyan-200"><a href="#installation">How to install <Download /></a></Button>}
      {!installed && <Button asChild size="lg" variant="outline" className="min-h-12 rounded-xl border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"><Link href="/auth/login">Open in browser <ArrowRight /></Link></Button>}
    </div>
    <p role="status" className="text-sm leading-6 text-slate-300">{installed ? 'The app is installed and ready to use.' : message || 'Free to install. Use your existing school account. Internet required.'}</p>
  </div>;
}
