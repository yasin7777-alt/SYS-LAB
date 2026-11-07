import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, ChevronDown, ExternalLink, Play, RotateCcw, Trophy, X } from 'lucide-react'
import { lessons, lessonExtras, lessonTakeaways } from '../data/courses'
import { exactLectureTexts } from '../data/lectureTexts'
import { usePersistentState } from '../hooks/usePersistentState'

type Props = { path: string; onNavigate: (path: string) => void }
// Preserve saved results after moving IP to slot 02 and dropping diagnostics.
const oldToNewIndex = [0, 2, 1, 3, 4, 5, 6, 7, 8, 9, -1, 10]
function savedProgressFromPreviousPatch(): number[] {
  try {
    const data: unknown = JSON.parse(window.localStorage.getItem('syslab-academy-baza-done-v1') || '[]')
    if (!Array.isArray(data)) return []
    return Array.from(new Set(data.filter((n): n is number => typeof n === 'number')
      .map(index => oldToNewIndex[index] ?? -1).filter(index => index >= 0)))
  } catch { return [] }
}
function savedResultsFromPreviousPatch(): Record<number, number> {
  try {
    const data: unknown = JSON.parse(window.localStorage.getItem('syslab-academy-baza-results-v1') || '{}')
    if (!data || typeof data !== 'object' || Array.isArray(data)) return {}
    const entries = Object.entries(data).flatMap(([key, value]) => {
      const index = oldToNewIndex[Number(key)] ?? -1
      return index >= 0 && typeof value === 'number' ? [[index, value] as const] : []
    })
    return Object.fromEntries(entries)
  } catch { return {} }
}

const lime = '#d7ff3f'

// Approved Academy videos. Files are served by Vite from public/videos/.
// Matching by lesson title keeps lessons and saved progress unchanged.
type LessonVideo = { label: string; src: string; fileName: string }
const lessonVideos: Record<string, LessonVideo[]> = {
  'Основные термины': [
    { label: 'Маршрутизатор, коммутатор и хаб', src: '/videos/academy/router-switch-hub.mp4', fileName: 'router-switch-hub.mp4' },
    { label: 'Дополнительно: Windows Server', src: '/videos/academy/windows-server.mp4', fileName: 'windows-server.mp4' },
  ],
  'IP-адрес': [
    { label: 'IP-адрес', src: '/videos/ip-address.mp4', fileName: 'ip-address.mp4' },
  ],
  'MAC-адрес': [
    { label: 'MAC-адрес', src: '/videos/academy/mac-address.mp4', fileName: 'mac-address.mp4' },
  ],
  'Маска подсети': [
    { label: 'Маска подсети', src: '/videos/academy/subnet-mask.mp4', fileName: 'subnet-mask.mp4' },
  ],
  'Модель OSI — 7 уровней': [
    { label: 'Модель OSI — 7 уровней', src: '/videos/academy/osi-seven-layers.mp4', fileName: 'osi-seven-layers.mp4' },
  ],
  'TCP и UDP': [
    { label: 'TCP и UDP', src: '/videos/academy/tcp-udp.mp4', fileName: 'tcp-udp.mp4' },
  ],
  'DNS': [
    { label: 'DNS', src: '/videos/academy/dns.mp4', fileName: 'dns.mp4' },
  ],
  'DHCP': [
    { label: 'DHCP', src: '/videos/academy/dhcp.mp4', fileName: 'dhcp.mp4' },
  ],
  'NAT и маршрутизация': [
    { label: 'Как NAT спас интернет', src: '/videos/academy/nat.mp4', fileName: 'nat.mp4' },
  ],
  'SSL и TLS': [
    { label: 'SSL и TLS — в чём разница', src: '/videos/academy/ssl-tls.mp4', fileName: 'ssl-tls.mp4' },
  ],
  'Собеседования': [
    { label: 'Собеседования', src: '/videos/academy/interviews.mp4', fileName: 'interviews.mp4' },
  ],
}

function LessonVideoPlayer({ video }: { video: LessonVideo }) {
  const [loadError, setLoadError] = useState(false)
  return <div className="mt-8">
    <div className="mb-3 text-sm font-semibold text-white/75">{video.label}</div>
    {loadError ? (
      <div role="status" className="flex aspect-video w-full flex-col items-center justify-center gap-4 rounded-lg bg-[#141a14] px-6 text-center ring-1 ring-white/10">
        <Play size={40} color={lime}/>
        <p className="max-w-lg text-sm leading-7 text-white/70">Видеофайл пока недоступен. Проверь наличие <code className="text-[#d7ff3f]">{video.fileName}</code> в нужной папке <code>public/videos/</code> и обнови страницу.</p>
      </div>
    ) : (
      <video src={video.src} controls playsInline preload="metadata" onError={() => setLoadError(true)} aria-label={`Видеоурок: ${video.label}`} className="aspect-video w-full rounded-lg bg-black object-contain ring-1 ring-white/10">
        Ваш браузер не поддерживает воспроизведение MP4.
      </video>
    )}
  </div>
}

export function CoursesPage({ path, onNavigate }: Props) {
  const detail = path.startsWith('/courses/baza-sisadmina')
  const [lessonIndex, setLessonIndex] = useState(0)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [checked, setChecked] = useState<Record<number, boolean>>({})
  const [showCelebration, setShowCelebration] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [done, setDone] = usePersistentState<number[]>('syslab-academy-baza-done-v2', savedProgressFromPreviousPatch())
  const [, setResults] = usePersistentState<Record<number, number>>('syslab-academy-baza-results-v2', savedResultsFromPreviousPatch())
  const quizRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLElement>(null)
  const lesson = lessons[lessonIndex]
  const lessonVideoList = lessonVideos[lesson.title] ?? []
  const exactText = exactLectureTexts[lesson.title]
  const question = lesson.questions[questionIndex]
  const score = lesson.questions.filter((q, i) => answers[i] === q.correct).length
  const progress = Math.round(done.length / lessons.length * 100)
  const completedQuiz = showResult
  const videoQuery = `https://www.youtube.com/results?search_query=${encodeURIComponent(lesson.videoQuery)}`
  const goTo = (node: HTMLElement | null) => node?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const changeLesson = (index: number) => {
    setLessonIndex(index); setQuestionIndex(0); setAnswers({}); setChecked({})
    setShowResult(false); setShowCelebration(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const checkAnswer = () => {
    if (answers[questionIndex] === undefined) return
    setChecked(prev => ({ ...prev, [questionIndex]: true }))
  }
  const nextQuestion = () => {
    if (!checked[questionIndex]) return
    if (questionIndex < lesson.questions.length - 1) {
      setQuestionIndex(n => n + 1)
    } else {
      setResults(prev => ({ ...prev, [lessonIndex]: score }))
      // Не отмечаем урок пройденным только по открытию теста — завершаем после итога.
      setShowResult(true)
      if (score === lesson.questions.length) setShowCelebration(true)
      setTimeout(() => goTo(videoRef.current), 150)
    }
  }
  const finishLesson = () => {
    if (!done.includes(lessonIndex)) setDone(prev => [...prev, lessonIndex])
    if (lessonIndex < lessons.length - 1) changeLesson(lessonIndex + 1)
    else onNavigate('/courses')
  }
  useEffect(() => {
    document.title = detail ? 'База Сисадмина | SYS/LAB Academy' : 'SYS/LAB Academy — Курсы'
    return () => { document.title = 'SYS/LAB' }
  }, [detail])
  return <div className="min-h-screen bg-[#090b0a] text-white">
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#090b0a]/95 backdrop-blur-xl">
      <div className="flex h-[72px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
        <button onClick={() => onNavigate('/')} className="flex items-center gap-3" aria-label="SYS/LAB Academy на главную">
          <img src="/images/syslab-academy-logo.png" alt="SYS/LAB Academy" className="h-9 w-auto max-w-[68vw] object-contain sm:h-11"/>
        </button>
        <button onClick={() => onNavigate(detail ? '/courses' : '/')} className="flex items-center gap-2 text-xs font-semibold text-white/65 transition hover:text-[#d7ff3f]">
          <ArrowLeft size={15}/>{detail ? 'К курсам' : 'На сайт'}
        </button>
      </div>
    </header>
    {!detail ? <main className="mx-auto max-w-[1450px] px-6 pb-28 pt-20 lg:px-12 lg:pt-28">
      <div className="font-mono text-xs tracking-[.24em]" style={{ color: lime }}>SYS/LAB / COURSES</div>
      <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6 font-display text-[clamp(4rem,10vw,10rem)] font-bold leading-[.9] tracking-[-.08em]">SYS/LAB<br/><span className="text-white/35">ACADEMY.</span></motion.h1>
      <p className="mt-10 max-w-2xl text-lg leading-8 text-white/60">Понятные лекции, проверка знаний и видеоматериалы. Изучай сети и системное администрирование шаг за шагом.</p>
      <button onClick={() => onNavigate('/courses/baza-sisadmina')} className="group mt-16 flex w-full flex-col justify-between gap-10 border-t border-white/20 py-12 text-left md:flex-row md:items-end">
        <div><span className="font-mono text-xs" style={{ color: lime }}>01 / {lessons.length} УРОКОВ</span><h2 className="mt-5 font-display text-5xl font-semibold tracking-[-.06em] md:text-7xl">База Сисадмина<span style={{ color: lime }}>.</span></h2><p className="mt-5 text-white/55">От сетевых терминов до диагностики и собеседований.</p></div>
        <span className="flex items-center gap-4 text-lg font-bold transition group-hover:text-[#d7ff3f]">Открыть курс <ArrowRight/></span>
      </button>
      <div className="font-mono text-xs text-white/45">Завершено: {done.length} / {lessons.length} ({progress}%)</div>
    </main> : <main className="grid min-h-[calc(100vh-72px)] grid-cols-1 lg:grid-cols-[minmax(270px,24%)_minmax(0,1fr)]">
      <aside className="border-b border-white/10 bg-[#0b0e0c] lg:sticky lg:top-[72px] lg:h-[calc(100vh-72px)] lg:overflow-y-auto lg:border-b-0 lg:border-r lg:border-white/10">
        <div className="pl-4 pr-5 pb-7 pt-9 sm:pl-6 sm:pr-7 lg:pl-6 lg:pr-8 xl:pl-8 xl:pr-10">
          <div className="font-mono text-[11px] uppercase tracking-[.19em] text-white/40">SYS/LAB ACADEMY</div>
          <h1 className="mb-3 mt-4 font-display text-3xl font-bold leading-tight tracking-[-.06em] xl:text-4xl">База Сисадмина<span style={{ color: lime }}>.</span></h1>
          <div className="text-xs text-white/40">{done.length} из {lessons.length} уроков завершено</div>
          <div className="mt-5 h-1 overflow-hidden rounded bg-white/10"><div className="h-full transition-all" style={{ width: `${progress}%`, background: lime }}/></div>
          <div className="mb-4 mt-10 font-mono text-xs tracking-[.14em] text-white/45">ПРОГРАММА / {lessons.length} УРОКОВ</div>
          <nav aria-label="Навигация по урокам" className="space-y-1">
            {lessons.map((item, index) => <button key={item.title} onClick={() => changeLesson(index)} aria-current={index === lessonIndex ? 'step' : undefined} className={`flex w-full items-center gap-3 rounded-md px-3 py-3.5 text-left text-sm transition-colors ${index === lessonIndex ? 'bg-[#d7ff3f] font-semibold text-[#090b0a]' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
              <span className="w-7 shrink-0 font-mono text-xs">{String(index + 1).padStart(2, '0')}</span><span className="min-w-0 flex-1">{item.title}</span>{done.includes(index) && <CheckCircle2 size={16} className="shrink-0"/>}
            </button>)}
          </nav>
        </div>
      </aside>
      <article className="min-w-0 px-5 pb-24 pt-10 sm:px-8 lg:px-10 lg:pt-14 xl:px-12 2xl:px-14">
        <div className="flex flex-wrap items-center justify-between gap-3"><span className="font-mono text-xs uppercase tracking-[.2em]" style={{ color: lime }}>УРОК {String(lessonIndex + 1).padStart(2, '0')} / {lessons.length}</span><span className="text-xs text-white/40">Читай вниз <ChevronDown size={14} className="inline"/></span></div>
        <section aria-labelledby="lecture-title" className="pt-9">
          <div className="flex items-center gap-2 font-mono text-xs tracking-[.14em]" style={{ color: lime }}><BookOpen size={16}/> ЛЕКЦИЯ</div>
          <motion.div key={lessonIndex} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .3 }}>
            <h2 id="lecture-title" className="mt-6 font-display text-[clamp(2.6rem,4vw,5rem)] font-bold leading-[1.02] tracking-[-.065em]">{lesson.title}</h2>
            {exactText !== undefined ? (
              <div className="mt-10 whitespace-pre-wrap break-words text-[15px] leading-[1.9] text-white/80 md:text-[16px]">{exactText}</div>
            ) : (
              <>
                <p className="mt-5 text-[16px] leading-7 text-white/50 md:text-[17px]">{lesson.summary}</p>
                <div className="mt-12 space-y-7 text-[15px] leading-[1.9] text-white/80 md:text-[16px]">
                  {lesson.reading.map((paragraph, i) => <p key={i}>{paragraph}</p>)}
                  <h3 className="pt-4 font-display text-[1.7rem] font-semibold tracking-[-.04em] text-white md:text-3xl">Разберём на примере</h3>
                  {lessonExtras[lessonIndex].map((paragraph, i) => <p key={i}>{paragraph}</p>)}
                </div>
              </>
            )}
            <button onClick={() => goTo(quizRef.current)} className="mt-14 inline-flex items-center gap-3 rounded-full bg-[#d7ff3f] px-7 py-3.5 font-semibold text-[#090b0a] transition hover:bg-white">Перейти к вопросам <ArrowRight size={18}/></button>
          </motion.div>
        </section>
        <section ref={quizRef} className="scroll-mt-28 mt-24 border-t border-white/15 pt-14" aria-label="Викторина">
          <div className="font-mono text-xs uppercase tracking-[.19em]" style={{ color: lime }}>02 / ПРОВЕРКА ЗНАНИЙ</div>
          <h2 className="mt-5 font-display text-4xl font-semibold tracking-[-.05em] md:text-5xl">Проверь себя<span style={{ color: lime }}>.</span></h2>
          <p className="mt-3 text-white/50">{lesson.questions.length} вопроса. Сначала выбери ответ, затем проверь его.</p>
          <div className="mt-10 flex items-center gap-2" aria-label={`Вопрос ${questionIndex + 1} из ${lesson.questions.length}`}>
            {lesson.questions.map((_, i) => <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= questionIndex ? 'bg-[#d7ff3f]' : 'bg-white/15'}`}/>)}
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={`${lessonIndex}-${questionIndex}`} initial={{ opacity: 0, x: 36, rotateY: -6 }} animate={{ opacity: 1, x: 0, rotateY: 0 }} exit={{ opacity: 0, x: -35, rotateY: 6 }} transition={{ duration: .35, ease: 'easeInOut' }} className="mt-10">
              <div className="font-mono text-xs text-white/40">ВОПРОС {questionIndex + 1} / {lesson.questions.length}</div>
              <h3 className="mt-5 font-display text-2xl font-semibold leading-snug tracking-[-.03em] md:text-4xl">{question.prompt}</h3>
              <div className="mt-8 grid gap-3">{question.options.map((option, index) => {
                const selected = answers[questionIndex] === index
                const verified = checked[questionIndex]
                const correct = index === question.correct
                const state = verified && correct ? 'border-[#d7ff3f] bg-[#d7ff3f]/10' : verified && selected && !correct ? 'border-red-400 bg-red-400/10' : selected ? 'border-[#d7ff3f] bg-white/[.05]' : 'border-white/15 hover:border-white/50'
                return <button key={index} disabled={verified} onClick={() => setAnswers(prev => ({ ...prev, [questionIndex]: index }))} className={`flex min-h-16 w-full items-center gap-4 rounded-lg border px-5 py-4 text-left transition disabled:cursor-default ${state}`}><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/20 font-mono text-xs">{String.fromCharCode(65 + index)}</span><span className="flex-1">{option}</span>{verified && correct && <Check size={19} style={{ color: lime }}/>} {verified && selected && !correct && <X size={19} className="text-red-400"/>}</button>
              })}</div>
              <AnimatePresence>{checked[questionIndex] && <motion.p initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-6 text-sm leading-7 text-white/70">{answers[questionIndex] === question.correct ? 'Верно! ' : 'Не совсем. '}{question.explanation}</motion.p>}</AnimatePresence>
              <div className="mt-9 flex flex-wrap gap-3"><button disabled={questionIndex === 0} onClick={() => setQuestionIndex(n => n - 1)} className="rounded-full border border-white/20 px-6 py-3 text-sm disabled:opacity-30">Назад</button>{!checked[questionIndex] ? <button disabled={answers[questionIndex] === undefined} onClick={checkAnswer} className="rounded-full bg-[#d7ff3f] px-7 py-3 font-semibold text-black disabled:opacity-30">Проверить ответ</button> : <button onClick={nextQuestion} className="inline-flex items-center gap-2 rounded-full bg-[#d7ff3f] px-7 py-3 font-semibold text-black">{questionIndex === lesson.questions.length - 1 ? 'Завершить викторину' : 'Следующий вопрос'} <ArrowRight size={18}/></button>}</div>
            </motion.div>
          </AnimatePresence>
          <AnimatePresence>{showCelebration && <motion.div initial={{ scale: .8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} className="relative mt-9 overflow-hidden rounded-xl border border-[#d7ff3f]/40 bg-[#d7ff3f]/10 px-6 py-9 text-center"><div className="pointer-events-none absolute inset-0">{Array.from({ length: 20 }, (_, i) => <motion.span key={i} className="absolute h-2 w-2 rounded-full bg-[#d7ff3f]" style={{ left: `${(i * 37) % 100}%`, top: '-10%' }} animate={{ y: [0, 160, 340], x: [0, (i % 2 ? 35 : -35)], rotate: 360, opacity: [0, 1, 0] }} transition={{ duration: 2.1, delay: i * .055 }}/>)}</div><Trophy className="mx-auto" color={lime} size={42}/><p className="mt-3 text-2xl font-bold">Идеально! Все ответы верные.</p><p className="mt-2 text-white/65">Вот это уровень. Теперь переходи к видео и итогу.</p><button onClick={() => setShowCelebration(false)} className="mt-4 text-sm text-white/50 underline">Скрыть</button></motion.div>}</AnimatePresence>
        </section>
        <section ref={videoRef} className="scroll-mt-28 mt-24 border-t border-white/15 pt-14" aria-label="Видео урока">
          <div className="flex items-center gap-2 font-mono text-xs tracking-[.19em]" style={{ color: lime }}><Play size={15}/> 03 / ВИДЕО</div>
          <h2 className="mt-5 font-display text-4xl font-semibold tracking-[-.05em] md:text-5xl">Смотри и закрепляй<span style={{ color: lime }}>.</span></h2>
          <p className="mt-4 max-w-3xl leading-8 text-white/55">Видеоматериалы для урока «{lesson.title}». Используй паузу, перемотку и полноэкранный режим.</p>
          {lessonVideoList.length > 0 ? (
            lessonVideoList.map(video => <LessonVideoPlayer key={video.src} video={video}/>)
          ) : (
            <div className="mt-8 flex aspect-video w-full flex-col items-center justify-center gap-5 rounded-lg bg-[#141a14] text-center ring-1 ring-white/10">
              <Play size={48} color={lime}/>
              <span className="max-w-sm px-4 text-sm text-white/45">Видеоматериал ещё не добавлен</span>
              <a href={videoQuery} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold hover:underline" style={{ color: lime }}>Поиск по теме <ExternalLink size={15}/></a>
            </div>
          )}
        </section>
        <section className="mt-24 border-t border-white/15 pt-14" aria-label="Итог урока">
          <div className="font-mono text-xs tracking-[.19em]" style={{ color: lime }}>04 / ИТОГ</div>
          <h2 className="mt-5 font-display text-4xl font-semibold tracking-[-.05em] md:text-5xl">Что в итоге<span style={{ color: lime }}>?</span></h2>
          <p className="mt-7 text-lg leading-9 text-white/75">{lessonTakeaways[lessonIndex]}</p>
          {completedQuiz ? <><p className="mt-6 text-white/60">Твой результат: <strong className="text-white">{score} из {lesson.questions.length}</strong> правильных ответов. {score === lesson.questions.length ? 'Красавчик, всё чётко!' : 'Нормально, главное — разобраться в ошибках.'}</p><div className="mt-8 flex flex-wrap gap-3"><button onClick={() => { setAnswers({}); setChecked({}); setQuestionIndex(0); setShowResult(false); setShowCelebration(false); goTo(quizRef.current) }} className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3.5 text-sm"><RotateCcw size={16}/> Пройти тест ещё раз</button><button onClick={finishLesson} className="inline-flex items-center gap-3 rounded-full bg-[#d7ff3f] px-7 py-3.5 font-semibold text-black">{lessonIndex < lessons.length - 1 ? 'Завершить и перейти к следующему уроку' : 'Завершить курс'} <ArrowRight size={18}/></button></div></> : <p className="mt-8 text-sm text-white/40">Пройди викторину выше, чтобы получить результат и завершить урок.</p>}
        </section>
      </article>
    </main>}
  </div>
}
