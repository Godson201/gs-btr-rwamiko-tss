import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, BookOpen, CircuitBoard, MessageCircle, Monitor, Smartphone, TrendingUp } from 'lucide-react';
import { AppInstallPanel } from '@/components/shared/app-install-panel';

export const metadata: Metadata = { title: 'Get the BTR Rwamiko app', description: 'Install the BTR Rwamiko TSS school app on your phone or computer.' };

export default function InstallPage() {
  return <main className="min-h-dvh bg-[#f5f8fb] text-slate-950">
    <section className="overflow-hidden bg-[#0b1831] text-white">
      <div className="mx-auto max-w-6xl px-5 pb-16 pt-6 sm:px-8 lg:pb-24">
        <nav className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/" className="flex min-h-11 items-center gap-2 text-sm text-slate-300 hover:text-white"><ArrowLeft className="size-4" />School home</Link>
          <span className="text-xs font-bold tracking-widest text-cyan-200">BTR RWAMIKO TSS</span>
        </nav>
        <div className="mt-12 grid items-center gap-12 lg:mt-20 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.2em] text-cyan-300">The school app</p>
            <h1 className="mt-5 text-5xl font-black leading-[1.05] tracking-tight sm:text-6xl">Your school.<br /><span className="text-cyan-300">One tap away.</span></h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-slate-300">Keep learning, stay connected, and follow progress. Bring your BTR Rwamiko portal to your phone’s home screen or your computer’s desktop.</p>
            <AppInstallPanel />
          </div>
          <div className="relative mx-auto w-full max-w-sm rounded-[2rem] border border-white/15 bg-white/5 p-8 text-center shadow-2xl">
            <Image src="/app-icons/icon-512.png" alt="BTR app icon: an open book with circuits and a gold growth arrow" width={192} height={192} priority className="mx-auto rounded-[2rem] ring-1 ring-white/15" />
            <h2 className="mt-6 text-2xl font-bold">BTR Rwamiko</h2>
            <p className="mt-2 text-sm text-cyan-200">Learning. Innovation. Growth.</p>
            <div className="mt-8 grid grid-cols-2 gap-3 text-left text-xs font-semibold">
              {[[BookOpen, 'Learning & classes'], [MessageCircle, 'School messages'], [TrendingUp, 'Student progress'], [CircuitBoard, 'School updates']].map(([Icon, title]) => {
                const FeatureIcon = Icon as typeof BookOpen;
                return <div key={title as string} className="rounded-xl bg-white/5 p-3"><FeatureIcon className="mb-3 size-5 text-cyan-300" />{title as string}</div>;
              })}
            </div>
            <p className="mt-5 text-xs leading-5 text-slate-400">Your portal shows the tools available to your school role.</p>
          </div>
        </div>
      </div>
    </section>
    <section id="installation" className="mx-auto max-w-6xl scroll-mt-6 px-5 py-16 sm:px-8">
      <p className="text-xs font-bold uppercase tracking-[.2em] text-cyan-700">Set up in a moment</p>
      <h2 className="mt-3 text-3xl font-bold tracking-tight">Choose your device.</h2>
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {[
          { title: 'Android', Icon: Smartphone, steps: ['Open this site in Chrome.', 'Tap “Install BTR Rwamiko” when available, or open the browser menu and choose “Install app” or “Add to Home screen”.', 'Confirm, then open BTR Rwamiko from your home screen.'] },
          { title: 'iPhone & iPad', Icon: Smartphone, steps: ['Open this site in Safari.', 'Tap Share, then “Add to Home Screen”.', 'Keep “Open as Web App” enabled if shown, then tap Add.'] },
          { title: 'Computer', Icon: Monitor, steps: ['Open this site in Chrome or Microsoft Edge.', 'Click “Install BTR Rwamiko” when available, or use the browser’s install icon or Apps menu.', 'Confirm and pin the app to your taskbar or dock for easy access.'] },
        ].map(({ title, Icon, steps }) => <article key={title} className="rounded-2xl border border-slate-200 bg-white p-6">
          <Icon className="size-7 text-cyan-700" /><h3 className="mt-4 text-xl font-bold">{title}</h3>
          <ol className="mt-5 list-decimal space-y-4 pl-5 text-sm leading-6 text-slate-600">{steps.map(step => <li key={step} className="pl-1">{step}</li>)}</ol>
        </article>)}
      </div>
      <p className="mt-5 text-sm leading-6 text-slate-500">If you opened a link inside a messaging app, open it in your browser first. Installation options depend on your device and browser.</p>
      <div className="mt-12 rounded-2xl border border-cyan-200 bg-cyan-50 p-6 sm:p-8">
        <h2 className="text-xl font-bold">A symbol of a smarter future.</h2>
        <p className="mt-3 max-w-3xl leading-7 text-slate-600">The open book represents learning. The circuit connections reflect technical skills and a connected school. The gold arrow points toward growth and opportunity at BTR Rwamiko TSS.</p>
      </div>
    </section>
  </main>;
}
