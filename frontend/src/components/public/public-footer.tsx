import Image from 'next/image';
import Link from 'next/link';

export function PublicFooter() {
  return <footer className="border-t border-slate-800 bg-slate-950 px-5 py-10 text-slate-300 sm:px-8"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 sm:flex-row sm:items-center"><div className="flex items-center gap-3"><span className="rounded-xl bg-white p-1"><Image src="/school-logo.png" alt="School crest" width={58} height={40} className="h-10 w-auto" /></span><div><p className="font-black text-white">G.S BTR RWAMIKO TSS</p><p className="text-xs">Practical knowledge. Strong character. A confident future.</p></div></div><nav className="flex flex-wrap gap-5 text-sm"><Link href="/programmes" className="hover:text-cyan-300">Programmes</Link><Link href="/admissions" className="hover:text-cyan-300">Apply</Link><Link href="/auth/login" className="hover:text-cyan-300">School portal</Link></nav></div></footer>;
}
