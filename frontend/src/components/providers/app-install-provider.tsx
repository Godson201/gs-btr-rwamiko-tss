'use client';

import { createContext, useContext, useEffect, useState } from 'react';

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type InstallResult = 'accepted' | 'dismissed' | 'unavailable' | 'error';
const InstallContext = createContext({
  available: false, installed: false,
  install: async (): Promise<InstallResult> => 'unavailable',
});

export function AppInstallProvider({ children }: { children: React.ReactNode }) {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const displayMode = window.matchMedia('(display-mode: standalone)');
    const updateMode = () => setInstalled(displayMode.matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    const onPrompt = (event: Event) => { event.preventDefault(); setPrompt(event as InstallPromptEvent); };
    const onInstalled = () => { setInstalled(true); setPrompt(null); };
    updateMode();
    displayMode.addEventListener('change', updateMode);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      void navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).catch(() => {
        // The online system remains usable if the browser disallows service workers.
      });
    }
    return () => {
      displayMode.removeEventListener('change', updateMode);
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = async (): Promise<InstallResult> => {
    if (!prompt) return 'unavailable';
    try {
      await prompt.prompt();
      return (await prompt.userChoice).outcome;
    } catch { return 'error'; }
    finally { setPrompt(null); }
  };

  return <InstallContext.Provider value={{ available: Boolean(prompt), installed, install }}>{children}</InstallContext.Provider>;
}

export const useAppInstall = () => useContext(InstallContext);
