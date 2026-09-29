import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function AppPromo() {
  return <section aria-label="Get the school app" className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
    <div className="flex flex-col gap-6 rounded-3xl bg-[#0b1831] p-6 text-white sm:flex-row sm:items-center sm:p-8">
      <Image src="/app-icons/icon-192.png" alt="BTR Rwamiko app icon" width={80} height={80} className="shrink-0 rounded-2xl ring-1 ring-white/15" />
      <div className="flex-1"><p className="text-xs font-bold uppercase tracking-widest text-cyan-300">BTR Rwamiko app</p><h2 className="mt-2 text-2xl font-bold tracking-tight">Your school, one tap away.</h2><p className="mt-2 text-sm leading-6 text-slate-300">Add the school portal to your phone or computer for easy access.</p></div>
      <Link href="/install" className="flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-cyan-300 px-5 py-3 font-bold text-slate-950 hover:bg-cyan-200">Get the app <ArrowRight className="size-4" /></Link>
    </div>
  </section>;
}
