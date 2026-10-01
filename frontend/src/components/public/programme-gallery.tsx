'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function ProgrammeGallery({ images }: { images: Array<{ src: string; alt: string }> }) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setActive((current) => (current + 1) % images.length), 6000);
    return () => window.clearInterval(timer);
  }, [images.length]);
  const move = (direction: number) => setActive((current) => (current + direction + images.length) % images.length);
  return <div className="relative overflow-hidden rounded-[2rem] bg-slate-900 shadow-2xl">
    <div className="relative aspect-[16/9]"><Image src={images[active].src} alt={images[active].alt} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 60vw" priority /><div className="absolute inset-0 bg-linear-to-t from-slate-950/65 via-transparent to-transparent" /></div>
    <button type="button" onClick={() => move(-1)} aria-label="Previous photograph" className="absolute left-4 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-slate-950/65 text-white backdrop-blur hover:bg-cyan-400 hover:text-slate-950"><ChevronLeft /></button>
    <button type="button" onClick={() => move(1)} aria-label="Next photograph" className="absolute right-4 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-slate-950/65 text-white backdrop-blur hover:bg-cyan-400 hover:text-slate-950"><ChevronRight /></button>
    <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2">{images.map((image, index) => <button key={image.src} type="button" onClick={() => setActive(index)} aria-label={`Show photograph ${index + 1}`} className={`h-2.5 rounded-full transition-all ${index === active ? 'w-8 bg-cyan-300' : 'w-2.5 bg-white/65'}`} />)}</div>
  </div>;
}
