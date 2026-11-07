import { ArrowUp, ArrowUpRight, Mail } from 'lucide-react'

interface FooterProps { onStart: (labId?: string) => void }

export function Footer({ onStart }: FooterProps) {
  const go = (selector: string) => document.querySelector(selector)?.scrollIntoView({ behavior: 'smooth' })
  return (
    <footer className="bg-[#090b0a] text-white">
      <div className="relative overflow-hidden border-b border-white/10 bg-[#d7ff3f] px-5 py-16 text-black sm:px-8 sm:py-20 lg:px-12">
        <div className="pointer-events-none absolute -right-10 -top-24 font-display text-[240px] font-semibold leading-none tracking-[-0.1em] text-black/[0.045] sm:text-[360px]">/</div>
        <div className="relative mx-auto flex max-w-[1500px] flex-col gap-9 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-black/50">Root access к новому навыку</div>
            <h2 className="mt-5 font-display text-[clamp(3.7rem,8vw,8rem)] font-semibold leading-[0.82] tracking-[-0.075em]">READY TO<br />BUILD?</h2>
          </div>
          <button onClick={() => onStart()} className="group flex h-[62px] w-fit items-center gap-12 bg-black px-6 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-white transition-transform hover:-translate-y-1">
            Открыть терминал<span className="grid h-9 w-9 place-items-center bg-[#d7ff3f] text-black transition-transform group-hover:rotate-45"><ArrowUpRight size={18} /></span>
          </button>
        </div>
      </div>

      <div className="px-5 pb-8 pt-14 sm:px-8 lg:px-12 lg:pt-20">
        <div className="mx-auto max-w-[1500px]">
          <div className="grid gap-12 border-b border-white/10 pb-14 sm:grid-cols-2 lg:grid-cols-12">
            <div className="sm:col-span-2 lg:col-span-6">
              <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="font-display text-[clamp(4rem,9vw,9rem)] font-semibold leading-[0.8] tracking-[-0.08em] text-white">SYS<span className="text-[#d7ff3f]">/</span>LAB</button>
              <p className="mt-7 max-w-sm text-sm leading-relaxed text-white/40">Образовательная платформа для тех, кто хочет не просто знать команды, а понимать и собирать инфраструктуру.</p>
            </div>
            <div className="lg:col-span-2">
              <h3 className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/30">Навигация</h3>
              <div className="mt-5 flex flex-col items-start gap-3 text-sm text-white/60">
                <button onClick={() => go('#faq')} className="hover:text-[#d7ff3f]">FAQ</button>
                <button onClick={() => go('#method')} className="hover:text-[#d7ff3f]">Метод</button>
                <button onClick={() => go('#lab')} className="hover:text-[#d7ff3f]">Лаборатория</button>
                <button onClick={() => go('#about')} className="hover:text-[#d7ff3f]">О платформе</button>
              </div>
            </div>
            <div className="lg:col-span-2">
              <h3 className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/30">Стенды</h3>
              <div className="mt-5 flex flex-col items-start gap-3 text-sm text-white/60">
                <button onClick={() => onStart('linux')} className="hover:text-[#d7ff3f]">Linux basics</button>
                <button onClick={() => onStart('network')} className="hover:text-[#d7ff3f]">Network repair</button>
                <button onClick={() => onStart('service')} className="hover:text-[#d7ff3f]">Service recovery</button>
              </div>
            </div>
            <div className="lg:col-span-2">
              <h3 className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/30">Связаться</h3>
              <a href="mailto:hello@syslab.education" className="mt-5 flex items-center gap-2 break-all text-sm text-white/60 transition-colors hover:text-[#d7ff3f]"><Mail size={14} className="shrink-0" />hello@syslab.education</a>
              <p className="mt-5 font-mono text-[8px] uppercase leading-relaxed tracking-wider text-white/25">По вопросам программ<br />и корпоративного обучения</p>
            </div>
          </div>
          <div className="flex flex-col gap-4 pt-7 font-mono text-[8px] uppercase tracking-[0.12em] text-white/25 sm:flex-row sm:items-center sm:justify-between">
            <span>© 2026 SYS/LAB · Don't just learn it. Build it.</span>
            <div className="flex items-center gap-6"><span>Made for curious minds / UTC+00</span><button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2 text-white/50 transition-colors hover:text-[#d7ff3f]">Наверх <ArrowUp size={12} /></button></div>
          </div>
        </div>
      </div>
    </footer>
  )
}
