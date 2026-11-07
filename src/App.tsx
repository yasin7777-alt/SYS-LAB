import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { Learn } from './components/Learn'
import { MethodScene } from './components/MethodScene'
import { Lab } from './components/Lab'
import { About } from './components/About'
import { Footer } from './components/Footer'
import { usePersistentState } from './hooks/usePersistentState'
import { scenarios } from './lib/labEngine'
import type { Track } from './data/tracks'
import { CoursesPage } from './components/CoursesPage'
import { CourseCatalogue } from './components/CourseCatalogue'
import { CoursesTransition } from './components/CoursesTransition'

const skills = ['LINUX', 'TCP / IP', 'WINDOWS SERVER', 'VIRTUALIZATION', 'ACTIVE DIRECTORY', 'SYSTEMD', 'NETWORKING', 'INFRASTRUCTURE']

function App() {
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname)
  const [courseTransitionPhase, setCourseTransitionPhase] = useState<'idle' | 'cover' | 'video' | 'reveal'>('idle')
  useEffect(() => {
    const handlePopstate = () => setCurrentPath(window.location.pathname)
    window.addEventListener('popstate', handlePopstate)
    return () => window.removeEventListener('popstate', handlePopstate)
  }, [])
  const openPath = useCallback((path: string) => {
    window.history.pushState({}, '', path)
    setCurrentPath(path)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  // Triggered only from the 'Курсы' navigation button on the main site.
  // Keep the new page behind the curtain until the source video finishes.
  const openCoursesWithTransition = () => {
    if (courseTransitionPhase !== 'idle') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      openPath('/courses')
      return
    }
    setCataloguePlanOnly(false)
    setCourseTransitionPhase('cover')
  }

  const onCourseCovered = useCallback(() => {
    openPath('/courses')
    setCourseTransitionPhase('video')
  }, [openPath])
  const onCourseVideoEnded = useCallback(() => setCourseTransitionPhase('reveal'), [])
  const onCourseRevealed = useCallback(() => setCourseTransitionPhase('idle'), [])
  const [activeLab, setActiveLab] = usePersistentState<string>('syslab-active-lab-v1', 'linux')
  const [plan, setPlan] = usePersistentState<string[]>('syslab-plan-v1', [])
  const [completed, setCompleted] = usePersistentState<Record<string, string[]>>('syslab-completed-v1', {})
  const [cataloguePlanOnly, setCataloguePlanOnly] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const totalTasks = scenarios.reduce((sum, scenario) => sum + scenario.tasks.length, 0)
  const completedCount = scenarios.reduce((sum, scenario) => sum + Math.min(completed[scenario.id]?.length ?? 0, scenario.tasks.length), 0)

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
  }, [])

  const notify = (message: string) => {
    setToast(message)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3200)
  }

  const openLab = (labId = activeLab) => {
    setActiveLab(labId)
    document.querySelector('#lab')?.scrollIntoView({ behavior: 'smooth' })
    window.setTimeout(() => document.querySelector<HTMLInputElement>('#lab-command')?.focus({ preventScroll: true }), 850)
  }

  const openPlan = () => {
    setCataloguePlanOnly(true)
    openPath('/courses')
  }

  const togglePlan = (track: Track) => {
    const included = plan.includes(track.id)
    setPlan(included ? plan.filter((id) => id !== track.id) : [...plan, track.id])
    notify(included ? `${track.title} удалён из плана` : `${track.title} добавлен в план`)
  }

  const goHomeSection = (href: string) => {
    openPath('/')
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
      document.querySelector(href)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }))
  }

  const openLabFromCatalogue = (labId: Track['labId']) => {
    setActiveLab(labId)
    goHomeSection('#lab')
    window.setTimeout(() => document.querySelector<HTMLInputElement>('#lab-command')?.focus({ preventScroll: true }), 850)
  }

  const toggleAcademyPlan = () => {
    setPlan(previous => previous.includes('baza-sisadmina')
      ? previous.filter(id => id !== 'baza-sisadmina')
      : [...previous, 'baza-sisadmina'])
  }

  // This overlay MUST stay at the same React tree position across route
  // changes. Previously each route returned its own copy, remounting the
  // curtain and showing the video during the wipe. Keep it as a stable sibling.
  return (
    <>
      {currentPath.startsWith('/courses/') ? (
        <CoursesPage path={currentPath} onNavigate={openPath} />
      ) : currentPath === '/courses' ? (
<div className="min-h-screen bg-[#0a0c0b] text-white antialiased">
      <Header
        mode="courses"
        cataloguePlanOnly={cataloguePlanOnly}
        planCount={plan.length}
        completedCount={completedCount}
        onOpenPlan={() => {
          setCataloguePlanOnly(true)
          document.querySelector('#courses-list')?.scrollIntoView({ behavior: 'smooth' })
        }}
        onStart={() => openLabFromCatalogue(activeLab as Track['labId'])}
        onOpenCourses={() => { setCataloguePlanOnly(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
        onGoHome={() => openPath('/')}
        onNavigateHomeSection={goHomeSection}
      />
      <CourseCatalogue
        plan={plan}
        completed={completed}
        planOnly={cataloguePlanOnly}
        onPlanOnlyChange={setCataloguePlanOnly}
        onTogglePlan={togglePlan}
        onToggleAcademyPlan={toggleAcademyPlan}
        onOpenLab={openLabFromCatalogue}
        onNavigate={openPath}
      />
    </div>
      ) : (
    <div className="min-h-screen bg-[#0a0c0b] text-white antialiased">
      <Header planCount={plan.length} completedCount={completedCount} onOpenPlan={openPlan} onStart={() => openLab()} onOpenCourses={openCoursesWithTransition} />
      <main>
        <Hero onStart={() => openLab()} />
        <div className="overflow-hidden border-b border-white/10 bg-[#101312] py-4" aria-hidden="true">
          <div className="skill-marquee flex w-max items-center">
            {[0, 1].map((copy) => (
              <div key={copy} className="flex shrink-0 items-center">
                {[...skills, ...skills, ...skills].map((skill, index) => (
                  <div key={`${copy}-${index}`} className="flex shrink-0 items-center syslab-meta-small uppercase text-white/45">
                    <span className="px-7">{skill}</span>
                    <span className="h-1 w-1 shrink-0 rotate-45 bg-[#d7ff3f]/60" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        <Learn />
        <MethodScene />
        <Lab activeId={activeLab} onActiveIdChange={setActiveLab} completed={completed} setCompleted={setCompleted} />
        <About completedCount={completedCount} totalTasks={totalTasks} planCount={plan.length} onContinue={() => openLab()} />
      </main>
      <Footer onStart={(labId) => openLab(labId)} />

      <AnimatePresence>
        {toast && (
          <motion.div role="status" initial={{ opacity: 0, y: 25, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.98 }} className="fixed bottom-5 left-5 right-5 z-[120] flex items-center gap-3 border border-[#d7ff3f]/25 bg-[#171c14]/95 px-4 py-4 font-mono text-[9px] uppercase leading-relaxed tracking-wider text-[#d7ff3f] shadow-2xl backdrop-blur-xl sm:left-auto sm:right-6 sm:max-w-md">
            <CheckCircle2 size={16} className="shrink-0" />{toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
      )}
      <CoursesTransition
        phase={courseTransitionPhase}
        onCovered={onCourseCovered}
        onVideoEnded={onCourseVideoEnded}
        onRevealed={onCourseRevealed}
      />
    </>
  )
}

export default App
