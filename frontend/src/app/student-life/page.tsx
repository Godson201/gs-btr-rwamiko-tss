import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Church, Dumbbell, Heart, Laptop2, Music2, Sparkles, Trophy, UsersRound } from 'lucide-react';
import { PublicHeader } from '@/components/public/public-header';
import { PublicFooter } from '@/components/public/public-footer';

export const metadata = {
  title: 'Student Life | G.S BTR Rwamiko TSS',
  description: 'Discover learning, faith, culture, sport, entertainment, friendship, and leadership at G.S BTR Rwamiko TSS.',
};

const experiences = [
  { icon: Trophy, title: 'Sport and teamwork', text: 'Football, training, competition, and celebration build fitness, discipline, resilience, and respect for every teammate.' },
  { icon: Laptop2, title: 'Digital growth', text: 'Guided computer training helps learners practise modern tools, collaborate confidently, and prepare for a changing workplace.' },
  { icon: Church, title: 'Faith and reflection', text: 'Prayer and values-based gatherings create time for gratitude, hope, compassion, good conduct, and care for one another.' },
  { icon: Music2, title: 'Culture and entertainment', text: 'Intore, music, performance, storytelling, and school celebrations let talent shine while keeping Rwandan identity alive.' },
  { icon: UsersRound, title: 'Leadership and service', text: 'Students learn responsibility through teamwork, peer support, school activities, and service to the wider community.' },
  { icon: Heart, title: 'Friendship and wellbeing', text: 'Shared study, play, mentoring, and joyful moments create belonging and help every learner grow with confidence.' },
];

const stories = [
  {
    image: '/images/student-life/intore-performance.jpeg',
    eyebrow: 'Culture & identity',
    title: 'Proud of where we come from',
    text: 'Through Intore and cultural presentation, learners practise confidence, discipline, public expression, and respect for Rwanda’s heritage. Performance becomes both education and joyful entertainment.',
  },
  {
    image: '/images/student-life/faith-assembly-enhanced.png',
    eyebrow: 'Faith & character',
    title: 'Time to listen, pray, and reflect',
    text: 'Community gatherings give learners space to reflect on values, encourage one another, and strengthen the character that guides academic work, relationships, and future service.',
  },
  {
    image: '/images/student-life/digital-training-enhanced.png',
    eyebrow: 'Learning beyond lessons',
    title: 'New skills, shared confidently',
    text: 'Training sessions connect students with practical digital tools and supportive guidance. Learners ask questions, practise together, and discover how technology can expand opportunity.',
  },
];

export default function StudentLifePage() {
  return <main className="min-h-screen bg-[#f6faf9] text-slate-950"><PublicHeader />
    <section className="relative overflow-hidden bg-slate-950 px-5 pb-20 pt-20 text-white sm:px-8 lg:pb-28 lg:pt-28">
      <div className="absolute -left-40 top-0 size-[34rem] rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.82fr_1.18fr] lg:items-center">
        <div><p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">Student life</p><h1 className="mt-5 text-5xl font-black leading-[.95] tracking-[-0.05em] sm:text-7xl">Learn together. Celebrate together.</h1><p className="mt-7 text-lg leading-8 text-slate-300">Life at G.S BTR Rwamiko TSS develops the whole person—knowledge, practical skill, health, faith, culture, friendship, creativity, and character.</p></div>
        <div className="grid grid-cols-2 gap-4"><Image src="/images/student-life/football-cup-celebration-enhanced.png" alt="Students celebrating a football cup together" width={1600} height={1000} className="col-span-2 aspect-[16/8] w-full rounded-[2rem] object-cover" priority /><Image src="/images/student-life/intore-performance.jpeg" alt="Students presenting Rwandan culture through Intore" width={900} height={600} className="aspect-square w-full rounded-[2rem] object-cover" /><Image src="/images/student-life/digital-training-enhanced.png" alt="Students participating in guided digital training" width={900} height={700} className="aspect-square w-full rounded-[2rem] object-cover" /></div>
      </div>
    </section>
    <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28"><div className="max-w-3xl"><p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">Beyond the timetable</p><h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">A school day filled with purpose and belonging.</h2><p className="mt-6 text-lg leading-8 text-slate-600">Lessons build knowledge, while shared experiences help learners recognise their strengths, form healthy habits, serve others, and create memories that stay with them long after graduation.</p></div><div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{experiences.map(({ icon: Icon, title, text }, index) => <article key={title} className={`rounded-[1.75rem] p-7 ${index % 2 ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white'}`}><span className={`grid size-12 place-items-center rounded-2xl ${index % 2 ? 'bg-cyan-400 text-slate-950' : 'bg-cyan-100 text-cyan-800'}`}><Icon className="size-6" /></span><h3 className="mt-5 text-xl font-black">{title}</h3><p className={`mt-3 leading-7 ${index % 2 ? 'text-slate-300' : 'text-slate-600'}`}>{text}</p></article>)}</div></section>
    <section className="bg-white px-5 py-20 sm:px-8 lg:py-28"><div className="mx-auto max-w-7xl"><div className="max-w-3xl"><p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">Stories from our community</p><h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">Real moments. Lasting formation.</h2></div><div className="mt-12 space-y-8">{stories.map((story, index) => <article key={story.title} className="grid overflow-hidden rounded-[2rem] border border-slate-200 bg-[#f6faf9] lg:grid-cols-2 lg:items-stretch"><div className={`relative min-h-[340px] ${index % 2 ? 'lg:order-2' : ''}`}><Image src={story.image} alt={story.title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" /></div><div className="flex items-center p-8 sm:p-12"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">{story.eyebrow}</p><h3 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">{story.title}</h3><p className="mt-5 text-lg leading-8 text-slate-600">{story.text}</p></div></div></article>)}</div></div></section>
    <section className="overflow-hidden bg-cyan-400"><div className="mx-auto grid max-w-7xl lg:grid-cols-2"><div className="relative min-h-[440px]"><Image src="/images/student-life/student-football-team.jpeg" alt="G.S BTR Rwamiko TSS student football team" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" /></div><div className="flex items-center p-8 sm:p-14 lg:p-16"><div><Dumbbell className="size-8" /><p className="mt-6 text-xs font-black uppercase tracking-[0.2em]">Sport & achievement</p><h2 className="mt-4 text-4xl font-black tracking-tight">Train with discipline. Compete with respect.</h2><p className="mt-6 leading-8 text-slate-800">Sport gives learners a practical lesson in preparation, communication, courage, and fair play. The student team competes with school pride, while teachers also model active living and teamwork.</p><div className="relative mt-8 aspect-[16/7] overflow-hidden rounded-[1.5rem]"><Image src="/images/student-life/teacher-football-team.jpeg" alt="Teachers modelling teamwork through school football" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 45vw" /></div></div></div></div></section>
    <section className="bg-slate-950 px-5 py-20 text-white sm:px-8 lg:py-28"><div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.05fr_.95fr] lg:items-center"><div className="relative min-h-[430px] overflow-hidden rounded-[2rem]"><Image src="/images/student-life/cultural-mentors.jpeg" alt="School mentors supporting a cultural celebration" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 55vw" /></div><div><Sparkles className="size-9 text-cyan-300" /><p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-cyan-300">Entertainment with meaning</p><h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">Talent, laughter, culture, and celebration.</h2><p className="mt-6 text-lg leading-8 text-slate-300">Entertainment at school is more than passing time. Cultural presentations, music, dance, spoken performance, friendly competitions, and celebration days give learners a safe stage to express talent, appreciate others, and strengthen community spirit.</p></div></div></section>
    <section className="mx-auto max-w-7xl px-5 py-20 text-center sm:px-8 lg:py-28"><h2 className="text-4xl font-black tracking-tight sm:text-5xl">See yourself here.</h2><p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600">Choose a programme, prepare your application, and join a community where learning, participation, character, and joy belong together.</p><div className="mt-8 flex flex-wrap justify-center gap-3"><Link href="/programmes" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-slate-300 bg-white px-6 font-bold">Explore programmes</Link><Link href="/admissions" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-slate-950 px-6 font-bold text-white">Apply for admission <ArrowRight className="size-4" /></Link></div></section>
    <PublicFooter />
  </main>;
}
