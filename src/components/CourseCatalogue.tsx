import { useEffect, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, ArrowUpRight, BookOpen, Check, Plus, X } from 'lucide-react'
import { tracks, type Track } from '../data/tracks'
import { lessons } from '../data/courses'
import { scenarios } from '../lib/labEngine'
import { usePersistentState } from '../hooks/usePersistentState'
import { TrackDialog } from './Tracks'

type Props = {
  plan: string[]
  completed: Record<string, string[]>
  planOnly: boolean
  onPlanOnlyChange: (value: boolean) => void
  onTogglePlan: (track: Track) => void
  onToggleAcademyPlan: () => void
  onOpenLab: (labId: Track['labId']) => void
  onNavigate: (path: string) => void
}

const academyId = 'baza-sisadmina'
const academyAccent = '#d7ff3f'
const oldToNewIndex = [0, 2, 1, 3, 4, 5, 6, 7, 8, 9, -1, 10]
function initialAcademyProgress(): number[] {
  try {
    const savedV2 = window.localStorage.getItem('syslab-academy-baza-done-v2')
    if (savedV2) {
      const parsed: unknown = JSON.parse(savedV2)
      return Array.isArray(parsed) ? parsed.filter((x): x is number => Number.isInteger(x) && x >= 0 && x < lessons.length) : []
    }
    const previous: unknown = JSON.parse(window.localStorage.getItem('syslab-academy-baza-done-v1') || '[]')
    if (!Array.isArray(previous)) return []
    return Array.from(new Set(previous.filter((n): n is number => typeof n === 'number').map(n => oldToNewIndex[n] ?? -1).filter(n => n >= 0)))
  } catch { return [] }
}

type CourseItem = {
  id: string
  name: string
  subtitle: string
  number: string
  accent: string
  duration: string
  level: string
  tags: string[]
  progress: number
  track?: Track
}

export function CourseCatalogue({ plan, completed, planOnly, onPlanOnlyChange, onTogglePlan, onToggleAcademyPlan, onOpenLab, onNavigate }: Props) {
  const [academyDone] = usePersistentState<number[]>('syslab-academy-baza-done-v2', initialAcademyProgress())
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null)
  const [academyOpen, setAcademyOpen] = useState(false)
  const progress = Math.round(Math.min(academyDone.length, lessons.length) / lessons.length * 100)
  const entries: CourseItem[] = [
    {
      id: academyId, number: '01', name: 'База Сисадмина', subtitle: 'Сети и системное администрирование — с самого начала',
      accent: academyAccent, duration: `${lessons.length} УРОКОВ`, level: 'С НУЛЯ', tags: ['IP / DNS', 'TCP / UDP'], progress,
    },
    ...tracks.map((track, index) => {
      const lab = scenarios.find(item => item.id === track.labId)
      const done = completed[track.labId]?.length ?? 0
      return {
        id: track.id, number: String(index + 2).padStart(2, '0'), name: track.title, subtitle: track.englishTitle,
        accent: track.accent, duration: track.duration, level: track.level,
        tags: track.tools.slice(0, 2), progress: lab ? Math.round(Math.min(done, lab.tasks.length) / lab.tasks.length * 100) : 0,
        track,
      }
    }),
  ]
  const visible = planOnly ? entries.filter(course => plan.includes(course.id)) : entries

  return (
    <main className="min-h-screen bg-[#0a0c0b] px-5 pb-28 pt-36 text-white sm:px-8 sm:pt-44 lg:px-12 lg:pt-48">
      <div className="mx-auto max-w-[1500px]">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .45 }} className="mb-8 font-mono text-[10px] uppercase tracking-[.19em] text-[#d7ff3f]">
          SYS/LAB ACADEMY / COURSES
        </motion.div>
        <div className="grid items-end gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <motion.h1 initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .55 }} className="font-display text-[clamp(3.3rem,6.5vw,7rem)] font-medium leading-[.9] tracking-[-.065em] text-[#f0f1ec]">
              Курсы<span className="text-[#d7ff3f]">.</span><br/><span className="text-white/30">Системы навыков.</span>
            </motion.h1>
          </div>
          <div className="lg:col-span-4 lg:pb-1">
            <p className="max-w-sm text-[15px] leading-relaxed text-white/50">От первых сетевых понятий до инфраструктуры. Выбери курс, изучай материал и собирай собственный план обучения.</p>
            <div className="mt-7 inline-flex border border-white/15 p-1 syslab-meta uppercase tracking-[.035em]" role="group" aria-label="Фильтр курсов">
              <button onClick={() => onPlanOnlyChange(false)} aria-pressed={!planOnly} className={`px-4 py-2.5 transition-colors ${!planOnly ? 'bg-white text-black' : 'text-white/45 hover:text-white'}`}>Все · {entries.length}</button>
              <button onClick={() => onPlanOnlyChange(true)} aria-pressed={planOnly} className={`px-4 py-2.5 transition-colors ${planOnly ? 'bg-[#d7ff3f] text-black' : 'text-white/45 hover:text-white'}`}>Мой план · {plan.length}</button>
            </div>
          </div>
        </div>

        <div id="courses-list" className="mt-16 scroll-mt-28 border-t border-white/15 lg:mt-24">
          <AnimatePresence mode="popLayout">
            {visible.map((course, index) => (
              <motion.article
                layout
                key={course.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -18 }}
                transition={{ duration: .42, delay: index * .035 }}
                className="track-row group relative border-b border-white/15"
                style={{ '--track-accent': course.accent } as CSSProperties}
              >
                <button
                  type="button"
                  onClick={() => course.track ? setSelectedTrack(course.track) : setAcademyOpen(true)}
                  className="relative z-10 grid w-full gap-5 px-1 py-8 text-left sm:py-10 lg:grid-cols-12 lg:items-center lg:gap-6 lg:py-12"
                  aria-label={`Открыть ${course.name}`}
                >
                  <div className="flex items-center justify-between lg:col-span-1 lg:block">
                    <span className="font-mono text-xs text-[var(--track-accent)]">/{course.number}</span>
                    <span className="font-mono text-[9px] uppercase tracking-widest text-white/30 lg:hidden">{course.level}</span>
                  </div>
                  <div className="lg:col-span-5">
                    <h2 className="font-display text-[clamp(2rem,3.8vw,4rem)] font-medium leading-none tracking-[-.055em] text-white/85 transition-colors group-hover:text-white">{course.name}</h2>
                    <p className="mt-3 font-sans text-[13px] font-medium leading-[1.5] tracking-normal text-white/55">{course.subtitle}</p>
                  </div>
                  <div className="lg:col-span-3">
                    <div className="flex flex-wrap gap-x-5 gap-y-2 syslab-meta uppercase text-white/55">
                      <span>{course.duration}</span><span>{course.level}</span>
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                      <div className="h-px flex-1 bg-white/15"><motion.div className="h-px origin-left bg-[var(--track-accent)]" initial={false} animate={{ scaleX: course.progress / 100 }} transition={{ duration: .5 }}/></div>
                      <span className="syslab-meta text-white/50">{course.progress}%</span>
                    </div>
                  </div>
                  <div className="hidden flex-wrap gap-2 lg:col-span-2 lg:flex">
                    {course.tags.map(tag => <span key={tag} className="border border-white/15 px-2.5 py-1.5 syslab-meta-small uppercase text-white/60">{tag}</span>)}
                  </div>
                  <div className="absolute right-0 top-8 lg:static lg:col-span-1 lg:flex lg:justify-end">
                    <span className="grid h-11 w-11 place-items-center rounded-full border border-white/20 text-white transition-all duration-300 group-hover:rotate-45 group-hover:border-[var(--track-accent)] group-hover:bg-[var(--track-accent)] group-hover:text-black lg:h-12 lg:w-12"><ArrowUpRight size={19} strokeWidth={1.5}/></span>
                  </div>
                </button>
              </motion.article>
            ))}
          </AnimatePresence>
          {visible.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid place-items-center border-b border-white/15 py-20 text-center">
              <BookOpen size={34} strokeWidth={1} className="mb-5 text-white/25"/>
              <h2 className="font-display text-3xl tracking-tight">В плане пока пусто</h2>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/45">Открой курс, добавь его в план — и он появится здесь.</p>
              <button onClick={() => onPlanOnlyChange(false)} className="mt-7 flex items-center gap-3 bg-[#d7ff3f] px-5 py-3 font-mono text-[10px] font-semibold uppercase tracking-widest text-black">Показать все курсы <ArrowRight size={15}/></button>
            </motion.div>
          )}
        </div>
      </div>
      <TrackDialog track={selectedTrack} inPlan={selectedTrack ? plan.includes(selectedTrack.id) : false} onClose={() => setSelectedTrack(null)} onTogglePlan={onTogglePlan} onOpenLab={onOpenLab}/>
      <AcademyDialog open={academyOpen} inPlan={plan.includes(academyId)} progress={progress} onClose={() => setAcademyOpen(false)} onTogglePlan={onToggleAcademyPlan} onStart={() => { setAcademyOpen(false); onNavigate('/courses/baza-sisadmina') }}/>
    </main>
  )
}

function AcademyDialog({ open, inPlan, progress, onClose, onTogglePlan, onStart }: { open: boolean; inPlan: boolean; progress: number; onClose: () => void; onTogglePlan: () => void; onStart: () => void }) {
  const reduced = useReducedMotion()
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = previous; window.removeEventListener('keydown', onKey) }
  }, [open, onClose])
  return createPortal(
    <AnimatePresence>
      {open && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={event => { if (event.target === event.currentTarget) onClose() }} className="fixed inset-0 z-[100] flex justify-end bg-black/70 backdrop-blur-sm">
        <motion.div role="dialog" aria-modal="true" aria-label="База Сисадмина" initial={reduced ? { opacity: 0 } : { x: '100%' }} animate={reduced ? { opacity: 1 } : { x: 0 }} exit={reduced ? { opacity: 0 } : { x: '100%' }} transition={{ duration: .55, ease: [.76, 0, .24, 1] }} className="h-full w-full max-w-[760px] overflow-y-auto border-l border-white/15 bg-[#101312]">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#101312]/95 px-5 py-4 sm:px-9"><span className="font-mono text-[10px] tracking-widest text-white/45">SYS/LAB ACADEMY / COURSE 01</span><button onClick={onClose} className="grid h-10 w-10 place-items-center border border-white/15" aria-label="Закрыть"><X size={18}/></button></div>
          <div className="px-5 py-10 sm:px-9 sm:py-12">
            <div className="font-mono text-xs text-[#d7ff3f]">С НУЛЯ · {lessons.length} УРОКОВ</div>
            <h2 className="mt-6 font-display text-[clamp(3rem,7vw,5.4rem)] font-medium leading-[.94] tracking-[-.06em]">База Сисадмина<span className="text-[#d7ff3f]">.</span></h2>
            <p className="mt-8 max-w-xl text-base leading-[1.8] text-white/60">Первые понятия о сетях, IP-адресация, OSI, TCP/UDP, DNS, DHCP, NAT и защита соединения. Теория, викторины, видео и итог каждого урока.</p>
            <div className="mt-10 border-t border-white/15 pt-6"><div className="flex justify-between syslab-meta text-white/50"><span>ПРОГРЕСС ОБУЧЕНИЯ</span><span>{progress}%</span></div><div className="mt-4 h-px bg-white/15"><motion.div className="h-px origin-left bg-[#d7ff3f]" initial={false} animate={{ scaleX: progress / 100 }}/></div></div>
            <div className="mt-10 grid gap-3 sm:grid-cols-2"><button onClick={onTogglePlan} className={`flex min-h-14 items-center justify-center gap-2 border px-5 text-xs font-semibold ${inPlan ? 'border-white/25 text-white' : 'border-transparent bg-white text-black'}`}>{inPlan ? <Check size={16}/> : <Plus size={16}/>} {inPlan ? 'В моём плане' : 'Добавить в план'}</button><button onClick={onStart} className="flex min-h-14 items-center justify-center gap-2 bg-[#d7ff3f] px-5 text-xs font-semibold text-black">{progress ? 'Продолжить обучение' : 'Открыть курс'} <ArrowUpRight size={17}/></button></div>
          </div>
        </motion.div>
      </motion.div>}
    </AnimatePresence>, document.body,
  )
}
