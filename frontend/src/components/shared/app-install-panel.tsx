'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Copy, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppInstall } from '@/components/providers/app-install-provider';

export function AppInstallPanel() {
  const { available, installed, install } = useAppInstall();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [instructions, setInstructions] = useState('');
  async function handleInstall() {
    if (!available) {
      const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      setInstructions(ios
        ? 'In Safari, tap Share → Add to Home Screen → Add. Keep “Open as Web App” enabled if shown.'
        : 'Open your browser menu and choose “Install app” or “Add to Home screen”. On a computer, use Chrome or Edge’s install icon or Apps menu. If you opened this link inside a messaging app, open it in your browser first.');
      return;
    }
    setInstructions('');
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
        : <Button size="lg" disabled={busy} onClick={handleInstall} className="min-h-12 rounded-xl bg-cyan-300 font-bold text-slate-950 hover:bg-cyan-200"><Download />{busy ? 'Opening installer…' : 'Install BTR Rwamiko'}</Button>}
      {!installed && <Button asChild size="lg" variant="outline" className="min-h-12 rounded-xl border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"><Link href="/auth/login">Open in browser <ArrowRight /></Link></Button>}
    </div>
    <p role="status" className="text-sm leading-6 text-slate-300">{installed ? 'The app is installed and ready to use.' : message || 'Free to install. Use your existing school account. Internet required.'}</p>
    {instructions && !installed && <div role="status" className="rounded-xl border border-cyan-300/30 bg-cyan-300/10 p-4 text-sm leading-6 text-white"><p>{instructions}</p><a href="#installation" className="mt-2 inline-block font-bold text-cyan-200 underline">See all installation steps</a></div>}
    <button type="button" className="inline-flex min-h-11 items-center gap-2 text-sm text-cyan-200 underline" onClick={async () => {
      try { await navigator.clipboard.writeText(new URL('/install', window.location.origin).href); setMessage('Install link copied. Share it so others can install the app.'); }
      catch { setMessage(`Copy this install link: ${new URL('/install', window.location.origin).href}`); }
    }}><Copy className="size-4" />Copy install link</button>
  </div>;
}
