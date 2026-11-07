import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, ArrowUpRight, BookOpen, Check, Clock3, Plus, Terminal, X } from 'lucide-react'
import { tracks, type Track } from '../data/tracks'
import { scenarios } from '../lib/labEngine'
import { Reveal } from './Reveal'

interface TracksProps {
  plan: string[]
  completed: Record<string, string[]>
  planOnly: boolean
  onPlanOnlyChange: (value: boolean) => void
  onTogglePlan: (track: Track) => void
  onOpenLab: (labId: Track['labId']) => void
  onOpenCourses?: () => void
}

export function Tracks({ plan, completed, planOnly, onPlanOnlyChange, onTogglePlan, onOpenLab, onOpenCourses }: TracksProps) {
  const [selected, setSelected] = useState<Track | null>(null)
  const visibleTracks = planOnly ? tracks.filter((track) => plan.includes(track.id)) : tracks

  return (
    <section id="tracks" className="relative bg-[#0a0c0b] px-5 py-24 sm:px-8 sm:py-32 lg:px-12 lg:py-40">
      <div className="mx-auto max-w-[1500px]">
        <Reveal>
          <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8">
              <h2 className="font-display text-[clamp(3rem,6.5vw,6.8rem)] font-medium leading-[0.9] tracking-[-0.065em] text-[#f0f1ec]">
                Не курсы.<br /><span className="text-white/30">Системы навыков.</span>
              </h2>
            </div>
            <div className="lg:col-span-4 lg:pb-2">
              <p className="max-w-sm text-[15px] leading-relaxed text-white/50">Каждый модуль завершается не тестом, а работающей конфигурацией. Соберите свой маршрут или начните с одного инцидента.</p>
              <div className="mt-7 inline-flex border border-white/15 p-1 syslab-meta uppercase tracking-[0.035em]">
                <button onClick={() => onPlanOnlyChange(false)} className={`px-4 py-2.5 transition-colors ${!planOnly ? 'bg-white text-black' : 'text-white/45 hover:text-white'}`}>Все · {tracks.length}</button>
                <button onClick={() => onPlanOnlyChange(true)} className={`px-4 py-2.5 transition-colors ${planOnly ? 'bg-[#d7ff3f] text-black' : 'text-white/45 hover:text-white'}`}>Мой план · {plan.length}</button>
              </div>
            </div>
          </div>
        </Reveal>

        <div className="mt-16 border-t border-white/15 lg:mt-24">
          <AnimatePresence mode="popLayout">
            {visibleTracks.map((track, index) => {
              const scenario = scenarios.find((item) => item.id === track.labId)!
              const done = Math.min(completed[track.labId]?.length ?? 0, scenario.tasks.length)
              const progress = Math.round((done / scenario.tasks.length) * 100)
              return (
                <motion.article
                  layout
                  key={track.id}
                  initial={{ opacity: 0, y: 25 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.45, delay: index * 0.04 }}
                  className="track-row group relative border-b border-white/15"
                  style={{ '--track-accent': track.accent } as CSSProperties}
                >
                  <button onClick={() => setSelected(track)} className="relative z-10 grid w-full gap-5 px-1 py-8 text-left sm:py-10 lg:grid-cols-12 lg:items-center lg:gap-6 lg:py-12">
                    <div className="flex items-center justify-between lg:col-span-1 lg:block">
                      <span className="font-mono text-xs text-[var(--track-accent)]">/{track.number}</span>
                      <span className="font-mono text-[9px] uppercase tracking-widest text-white/30 lg:hidden">{track.level}</span>
                    </div>
                    <div className="lg:col-span-5">
                      <h3 className="font-display text-[clamp(2rem,3.8vw,4rem)] font-medium leading-none tracking-[-0.055em] text-white/85 transition-colors group-hover:text-white">{track.title}</h3>
                      <p className="mt-3 font-sans text-[13px] font-medium leading-[1.5] tracking-normal text-white/55">{track.englishTitle}</p>
                    </div>
                    <div className="lg:col-span-3">
                      <div className="flex flex-wrap gap-x-5 gap-y-2 syslab-meta uppercase text-white/55">
                        <span>{track.duration}</span><span>{track.level}</span>
                      </div>
                      <div className="mt-4 flex items-center gap-3">
                        <div className="h-px flex-1 bg-white/15"><motion.div className="h-px origin-left bg-[var(--track-accent)]" initial={false} animate={{ scaleX: progress / 100 }} /></div>
                        <span className="syslab-meta text-white/50">{progress}%</span>
                      </div>
                    </div>
                    <div className="hidden flex-wrap gap-2 lg:col-span-2 lg:flex">
                      {track.tools.slice(0, 2).map((tool) => <span key={tool} className="border border-white/15 px-2.5 py-1.5 syslab-meta-small uppercase text-white/60">{tool}</span>)}
                    </div>
                    <div className="absolute right-0 top-8 lg:static lg:col-span-1 lg:flex lg:justify-end">
                      <span className="grid h-11 w-11 place-items-center rounded-full border border-white/20 text-white transition-all duration-300 group-hover:rotate-45 group-hover:border-[var(--track-accent)] group-hover:bg-[var(--track-accent)] group-hover:text-black lg:h-12 lg:w-12"><ArrowUpRight size={19} strokeWidth={1.5} /></span>
                    </div>
                  </button>
                </motion.article>
              )
            })}
          </AnimatePresence>
          {planOnly && plan.includes('baza-sisadmina') && onOpenCourses && (
            <motion.div layout initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="track-row group relative border-b border-white/15" style={{ '--track-accent': '#d7ff3f' } as CSSProperties}>
              <button onClick={onOpenCourses} className="relative z-10 grid w-full gap-5 px-1 py-8 text-left sm:py-10 lg:grid-cols-12 lg:items-center lg:gap-6 lg:py-12">
                <div className="font-mono text-xs text-[#d7ff3f] lg:col-span-1">/A</div>
                <div className="lg:col-span-5"><h3 className="font-display text-[clamp(2rem,3.8vw,4rem)] font-medium leading-none tracking-[-0.055em] text-white/85">База Сисадмина</h3><p className="mt-3 text-[13px] text-white/55">Полный курс · SYS/LAB Academy</p></div>
                <div className="syslab-meta text-white/55 lg:col-span-3">11 УРОКОВ · С НУЛЯ</div>
                <div className="text-xs text-white/50 lg:col-span-2">В моём плане</div>
                <div className="lg:col-span-1 lg:flex lg:justify-end"><span className="grid h-11 w-11 place-items-center rounded-full border border-white/20 group-hover:bg-[#d7ff3f] group-hover:text-black"><ArrowUpRight size={19}/></span></div>
              </button>
            </motion.div>
          )}
          {visibleTracks.length === 0 && !(planOnly && plan.includes('baza-sisadmina')) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid place-items-center border-b border-white/15 py-20 text-center">
              <BookOpen className="mb-5 text-white/25" size={34} strokeWidth={1} />
              <h3 className="font-display text-3xl tracking-tight">В плане пока пусто</h3>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/45">Откройте направление и добавьте его в план. Выбор сохранится в этом браузере.</p>
              <button onClick={() => onPlanOnlyChange(false)} className="mt-7 flex items-center gap-3 bg-[#d7ff3f] px-5 py-3 font-mono text-[10px] font-semibold uppercase tracking-widest text-black">Выбрать трек <ArrowRight size={15} /></button>
            </motion.div>
          )}
        </div>
      </div>
      <TrackDialog track={selected} onClose={() => setSelected(null)} inPlan={selected ? plan.includes(selected.id) : false} onTogglePlan={onTogglePlan} onOpenLab={onOpenLab} />
    </section>
  )
}

interface TrackDialogProps {
  track: Track | null
  inPlan: boolean
  onClose: () => void
  onTogglePlan: (track: Track) => void
  onOpenLab: (labId: Track['labId']) => void
}

export function TrackDialog({ track, inPlan, onClose, onTogglePlan, onOpenLab }: TrackDialogProps) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (!track) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [track, onClose])

  return createPortal(
    <AnimatePresence>
      {track && (
        <motion.div className="fixed inset-0 z-[100] flex justify-end bg-black/70 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="track-dialog-title"
            initial={reduced ? { opacity: 0 } : { x: '100%' }}
            animate={reduced ? { opacity: 1 } : { x: 0 }}
            exit={reduced ? { opacity: 0 } : { x: '100%' }}
            transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
            className="h-full w-full max-w-[760px] overflow-y-auto border-l border-white/15 bg-[#101312]"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#101312]/90 px-5 py-4 backdrop-blur-xl sm:px-9">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">SYS/LAB · TRACK_{track.number}</span>
              <button ref={closeRef} onClick={onClose} className="grid h-10 w-10 place-items-center border border-white/15 transition-colors hover:bg-white hover:text-black" aria-label="Закрыть описание трека"><X size={18} /></button>
            </div>
            <div className="px-5 py-10 sm:px-9 sm:py-12">
              <div className="flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.16em]" style={{ color: track.accent }}><span className="h-1.5 w-1.5 rounded-full bg-current" />{track.level} · {track.duration}</div>
              <h2 id="track-dialog-title" className="mt-6 font-display text-[clamp(2.8rem,7vw,5.4rem)] font-medium leading-[0.9] tracking-[-0.06em]">{track.title}</h2>
              <p className="mt-4 font-sans text-[13px] font-medium leading-[1.5] tracking-normal text-white/60">{track.englishTitle}</p>
              <p className="mt-8 max-w-[620px] text-base leading-[1.75] text-white/60">{track.description}</p>

              <div className="mt-9 border-l-2 py-1 pl-5" style={{ borderColor: track.accent }}>
                <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/35">Результат</span>
                <p className="mt-2 text-sm leading-relaxed text-white/80">{track.outcome}</p>
              </div>

              <div className="mt-10 flex flex-wrap gap-2">
                {track.skills.map((skill) => <span key={skill} className="border border-white/15 px-3 py-2 font-mono text-[9px] uppercase tracking-wider text-white/55">{skill}</span>)}
              </div>

              <div className="mt-12 flex items-end justify-between border-b border-white/15 pb-4">
                <h3 className="font-display text-2xl tracking-tight">Архитектура трека</h3>
                <span className="font-mono text-[9px] uppercase tracking-widest text-white/35">{track.format}</span>
              </div>
              <div>
                {track.modules.map((module) => (
                  <div key={module.code} className="grid gap-3 border-b border-white/10 py-7 sm:grid-cols-[90px_1fr]">
                    <div className="font-mono text-[10px] text-white/35">{module.code}<br /><span className="mt-2 inline-flex items-center gap-1 text-[8px] uppercase"><Clock3 size={10} />{module.lessons} уроков</span></div>
                    <div>
                      <h4 className="font-display text-xl font-medium tracking-tight">{module.title}</h4>
                      <p className="mt-2 text-sm leading-relaxed text-white/45">{module.description}</p>
                      <div className="mt-4 flex gap-3 bg-white/[0.035] p-3 text-xs leading-relaxed text-white/60"><Terminal size={14} className="mt-0.5 shrink-0" style={{ color: track.accent }} /><span><strong className="mr-1 font-mono text-[9px] uppercase tracking-wider text-white/35">Lab:</strong>{module.lab}</span></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10 grid gap-3 sm:grid-cols-2">
                <button onClick={() => onTogglePlan(track)} className={`flex min-h-14 items-center justify-center gap-3 border px-4 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors ${inPlan ? 'border-white/25 text-white hover:bg-white/5' : 'border-transparent bg-white text-black hover:bg-[#d7ff3f]'}`}>
                  {inPlan ? <Check size={16} /> : <Plus size={16} />}{inPlan ? 'В моём плане' : 'Добавить в план'}
                </button>
                <button onClick={() => { onClose(); onOpenLab(track.labId) }} className="flex min-h-14 items-center justify-center gap-3 bg-[#d7ff3f] px-4 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-black transition-colors hover:bg-white">
                  Открыть lab <ArrowUpRight size={16} />
                </button>
              </div>
              <p className="mt-4 text-center font-mono text-[8px] uppercase tracking-wider text-white/25">План и прогресс хранятся локально · без регистрации</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
