import { ExternalLink } from 'lucide-react';

const stakeholders = [
  { abbreviation: 'MINEDUC', name: 'Ministry of Education', href: 'https://www.mineduc.gov.rw/' },
  { abbreviation: 'RTB', name: 'Rwanda TVET Board', href: 'https://www.rtb.gov.rw/' },
  { abbreviation: 'REB', name: 'Rwanda Basic Education Board', href: 'https://www.reb.gov.rw/' },
  { abbreviation: 'NESA', name: 'National Examination and School Inspection Authority', href: 'https://www.nesa.gov.rw/' },
  { abbreviation: 'MIFOTRA', name: 'Ministry of Public Service and Labour', href: 'https://www.mifotra.gov.rw/' },
  { abbreviation: 'RP', name: 'Rwanda Polytechnic', href: 'https://www.rp.ac.rw/' },
] as const;

export function StakeholderLinks() {
  return (
    <section aria-labelledby="stakeholders-heading" className="border-b border-white/10 pb-9">
      <div className="max-w-2xl">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">Education ecosystem</p>
        <h2 id="stakeholders-heading" className="mt-2 text-xl font-black text-white">Partners &amp; Stakeholders</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">Official institutions supporting education, skills development, assessment, employment, and progression in Rwanda.</p>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {stakeholders.map((stakeholder) => (
          <a
            key={stakeholder.abbreviation}
            href={stakeholder.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex min-h-20 items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition hover:-translate-y-0.5 hover:border-cyan-300/50 hover:bg-white/10"
            aria-label={`Visit the official ${stakeholder.name} website`}
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-cyan-300 text-[10px] font-black tracking-tight text-slate-950">{stakeholder.abbreviation}</span>
              <span className="text-sm font-semibold leading-5 text-slate-200">{stakeholder.name}</span>
            </span>
            <ExternalLink className="size-4 shrink-0 text-slate-500 transition group-hover:text-cyan-300" aria-hidden />
          </a>
        ))}
      </div>
    </section>
  );
}
