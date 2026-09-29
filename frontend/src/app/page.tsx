import Image from 'next/image';
import { SchoolUpdates } from '@/components/shared/school-updates';
import { AppPromo } from '@/components/shared/app-promo';
import Link from 'next/link';
import { ArrowRight, BookOpen, CheckCircle2, Cpu, MapPin, ShieldCheck, Sparkles, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MobileHomeNav } from '@/components/layout/mobile-home-nav';
import { LanguageSwitcher } from '@/components/shared/language-switcher';

const programmes = ['Computer Systems & Architecture', 'Software Development', 'Network & Internet Technology', 'Electrical Technology', 'Electronics & Telecommunication', 'Building Construction', 'Professional Accounting'];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f7faf9] text-slate-950">
      <header className="absolute inset-x-0 top-0 z-30 border-b border-white/15 bg-slate-950/20 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2 text-white" aria-label="School home">
            <span className="flex size-11 shrink-0 sm:size-14 items-center justify-center rounded-2xl bg-white p-1.5 shadow-lg"><Image src="/school-logo.png" alt="G.S BTR Rwamiko TSS crest" width={62} height={42} className="h-auto w-full" priority /></span>
            <span className="leading-tight"><span className="block text-xs font-black tracking-wide sm:text-sm">G.S BTR RWAMIKO TSS</span><span className="block text-[9px] uppercase tracking-wide sm:text-[10px] sm:tracking-[0.19em] text-cyan-100">Skills • Character • Future</span></span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-semibold text-white/85 xl:flex"><a href="#school-updates" className="transition hover:text-white">School updates</a><a href="#story" className="transition hover:text-white">Our story</a><a href="#programmes" className="transition hover:text-white">Programmes</a><a href="#student-life" className="transition hover:text-white">Student life</a></nav>
          <div className="hidden items-center gap-3 sm:flex"><LanguageSwitcher compact /><Link href="/admissions" className="text-sm font-bold text-white hover:text-cyan-200">Apply now</Link><Button asChild className="rounded-full bg-cyan-400 text-slate-950 shadow-lg hover:bg-cyan-300"><Link href="/auth/login">Portal login <ArrowRight className="size-4" /></Link></Button></div>
          <MobileHomeNav />
        </div>
      </header>

      <section className="relative flex min-h-[640px] sm:min-h-[760px] items-end overflow-hidden bg-slate-950 lg:min-h-screen">
        <Image src="/students-campus.png" alt="Students walking together on a green school campus" fill className="object-cover object-center" priority sizes="100vw" />
        <div className="absolute inset-0 bg-linear-to-r from-slate-950 via-slate-950/75 to-slate-950/10" /><div className="absolute inset-0 bg-linear-to-t from-slate-950 via-transparent to-slate-950/20" />
        <div className="school-orb school-orb-one" /><div className="school-orb school-orb-two" /><div className="school-grid absolute inset-0 opacity-20" />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-20 pt-36 sm:px-8 lg:pb-28">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-[10px] font-bold uppercase tracking-wide sm:text-xs sm:tracking-[0.18em] text-cyan-200 backdrop-blur"><Sparkles className="size-4" /> Excellent education, practical skills</div>
            <h1 className="text-balance text-4xl font-black leading-[0.95] tracking-[-0.045em] text-white sm:text-6xl lg:text-8xl">Learning today.<span className="mt-2 block text-cyan-300">Building tomorrow.</span></h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-200 sm:text-xl">At G.S BTR Rwamiko TSS, knowledge meets practice. We prepare young people to think boldly, master real skills, and create a prosperous Rwanda.</p>
            <div className="mt-9 flex flex-wrap gap-3"><Button asChild size="lg" className="h-13 rounded-full bg-cyan-400 px-7 font-bold text-slate-950 hover:bg-cyan-300"><Link href="/admissions">Apply for admission <ArrowRight className="size-4" /></Link></Button><Button asChild size="lg" variant="outline" className="h-13 rounded-full border-white/30 bg-white/5 px-7 text-white backdrop-blur hover:bg-white/15 hover:text-white"><Link href="/auth/login">Access school portal</Link></Button></div>
          </div>
        </div>
      </section>

      <div className="overflow-hidden bg-cyan-400 py-3 text-slate-950"><div className="school-marquee flex w-max items-center gap-8 whitespace-nowrap text-xs font-black uppercase tracking-[0.22em]">{[...programmes, ...programmes].map((item, index) => <span key={`${item}-${index}`} className="flex items-center gap-8"><span>{item}</span><span aria-hidden>◆</span></span>)}</div></div>

      <SchoolUpdates />
      <AppPromo />

      <section id="story" className="relative mx-auto grid max-w-7xl gap-14 px-5 py-24 sm:px-8 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:py-32">
        <div><p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">Our purpose</p><h2 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl">A school where potential becomes purpose.</h2><p className="mt-6 text-lg leading-8 text-slate-600">Rooted in Rwamiko and focused on the future, our learning community combines strong academics, technical mastery, discipline, and collaboration.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">{[['Excellent education', BookOpen], ['Practice-led learning', Wrench], ['Digital confidence', Cpu], ['Safe community', ShieldCheck]].map(([label, Icon]) => <div key={label as string} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><span className="rounded-xl bg-cyan-100 p-2 text-cyan-800"><Icon className="size-5" /></span><span className="text-sm font-bold">{label as string}</span></div>)}</div>
        </div>
        <div className="relative"><div className="absolute -inset-5 -z-10 rounded-[2.5rem] bg-linear-to-br from-cyan-200 to-emerald-100 blur-2xl" /><Image src="/students-classroom.png" alt="Students collaborating during a classroom lesson" width={1536} height={1024} className="aspect-[4/3] w-full rounded-[2rem] object-cover shadow-2xl" sizes="(max-width: 1024px) 100vw, 55vw" /><div className="absolute -bottom-7 left-5 rounded-2xl bg-slate-950 p-5 text-white shadow-xl sm:left-8"><p className="text-3xl font-black text-cyan-300">7</p><p className="text-xs font-bold uppercase tracking-widest">Career pathways</p></div></div>
      </section>

      <section id="programmes" className="bg-slate-950 py-24 text-white lg:py-32"><div className="mx-auto max-w-7xl px-5 sm:px-8"><div className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <div className="relative overflow-hidden rounded-[2rem]"><Image src="/students-workshop.png" alt="Students learning electronics and computing in a workshop" width={1536} height={1024} className="aspect-[4/3] w-full object-cover transition duration-700 hover:scale-105" sizes="(max-width: 1024px) 100vw, 50vw" /><div className="absolute inset-0 bg-linear-to-t from-slate-950/70 to-transparent" /><p className="absolute bottom-6 left-6 text-sm font-bold uppercase tracking-[0.2em] text-cyan-200">Learn by doing</p></div>
        <div><p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">Technical pathways</p><h2 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl">Skills built for the real world.</h2><div className="mt-8 grid gap-3 sm:grid-cols-2">{programmes.map(programme => <div key={programme} className="flex gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-sm font-semibold text-slate-200"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-cyan-300" />{programme}</div>)}</div></div>
      </div></div></section>

      <section id="student-life" className="relative overflow-hidden px-5 py-24 sm:px-8 lg:py-32">
        <div className="school-orb school-orb-three" />
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-cyan-400 text-slate-950 shadow-2xl">
          <div className="flex flex-col items-center justify-center px-6 py-14 text-center sm:px-12">
            <MapPin className="size-7" />
            <p className="mt-5 text-xs font-black uppercase tracking-[0.22em]">Ruramba Sector • Nyaruguru District</p>
            <h2 className="mt-5 text-4xl font-black tracking-[-0.04em] sm:text-5xl">Your journey can start here.</h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-800">Join a community shaped by ambition, practical knowledge, and a shared commitment to progress.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="h-13 rounded-full bg-slate-950 px-7 font-bold text-white hover:bg-slate-800"><Link href="/auth/login">Enter the school portal <ArrowRight className="size-4" /></Link></Button>
            </div>
          </div>
          <details className="group border-t border-slate-900/15 bg-white">
            <summary className="flex cursor-pointer list-none items-center justify-center gap-2 px-6 py-5 font-bold text-slate-900 transition hover:bg-cyan-50 [&::-webkit-details-marker]:hidden">
              <MapPin className="size-5 text-cyan-700" />
              <span className="group-open:hidden">View Google Map</span>
              <span className="hidden group-open:inline">Hide Google Map</span>
            </summary>
            <div className="border-t">
              <iframe title="G.S BTR Rwamiko TSS location on Google Maps" src="https://www.google.com/maps?q=GS+BTR+Rwamiko+TSS,+Ruramba,+Nyaruguru,+Rwanda&output=embed" className="h-[420px] w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
              <div className="flex justify-center border-t bg-white p-4"><Button asChild variant="outline" className="rounded-full"><a href="https://www.google.com/maps/search/?api=1&query=GS+BTR+Rwamiko+TSS%2C+Ruramba%2C+Nyaruguru%2C+Rwanda" target="_blank" rel="noreferrer">Open directions in Google Maps <ArrowRight className="size-4" /></a></Button></div>
            </div>
          </details>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white px-5 py-8 sm:px-8"><div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 text-center sm:flex-row sm:text-left"><div className="flex items-center gap-3"><Image src="/school-logo.png" alt="School crest" width={64} height={43} className="h-12 w-auto object-contain" /><div><p className="text-sm font-black">G.S BTR RWAMIKO TSS</p><p className="text-xs text-slate-500">Through Here, Wealth is Flash</p></div></div><p className="text-xs text-slate-500">© {new Date().getFullYear()} G.S BTR Rwamiko TSS. Learning with purpose.</p></div></footer>
    </main>
  );
}
