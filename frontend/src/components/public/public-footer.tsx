import Image from 'next/image';
import Link from 'next/link';
import { StakeholderLinks } from '@/components/public/stakeholder-links';

export function PublicFooter() {
  return <footer className="border-t border-slate-800 bg-slate-950 px-5 py-12 text-slate-300 sm:px-8"><div className="mx-auto max-w-7xl"><StakeholderLinks /><div className="flex flex-col justify-between gap-8 pt-9 sm:flex-row sm:items-center"><div className="flex items-center gap-3"><span className="rounded-xl bg-white p-1"><Image src="/school-logo.png" alt="School crest" width={58} height={40} className="h-10 w-auto" /></span><div><p className="font-black text-white">G.S BTR RWAMIKO TSS</p><p className="text-xs">Practical knowledge. Strong character. A confident future.</p></div></div><nav aria-label="Footer navigation" className="flex flex-wrap gap-5 text-sm"><Link href="/programmes" className="hover:text-cyan-300">Programmes</Link><Link href="/admissions" className="hover:text-cyan-300">Apply</Link><Link href="/auth/login" className="hover:text-cyan-300">School portal</Link></nav></div><p className="mt-8 border-t border-white/10 pt-5 text-center text-xs text-slate-500">© {new Date().getFullYear()} G.S BTR Rwamiko TSS. Learning with purpose.</p></div></footer>;
}
