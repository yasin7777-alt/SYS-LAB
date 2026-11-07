import { useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from 'framer-motion'
import {
  ArrowRight, BookOpen, Check, CheckCircle2, CircleHelp, Network,
  RotateCcw, Sparkles, Terminal, Trophy, X,
} from 'lucide-react'
import { usePersistentState } from '../hooks/usePersistentState'

const lessons = [
  {
    id: 'ip',
    eyebrow: 'NET / 001',
    title: 'Что такое IP-адрес?',
    text: 'IP-адрес помогает устройствам обмениваться пакетами в сети. Например, адрес 192.168.10.25 может быть назначен компьютеру в локальной сети.',
    detail: 'Маска подсети определяет, какие адреса находятся в той же подсети. Шлюз по умолчанию помогает отправлять пакеты в другие сети.',
    terminal: '$ ip addr show\ninet 192.168.10.25/24 scope global eth0',
    question: 'Для чего в сети нужен IP-адрес?',
    answers: ['Для хранения паролей', 'Для адресации сетевого интерфейса', 'Для увеличения скорости процессора'],
    correct: 1,
    hint: 'Подумай, как маршрутизатор и компьютер понимают, куда направить пакет.',
  },
  {
    id: 'dhcp',
    eyebrow: 'NET / 002',
    title: 'Как работает DHCP?',
    text: 'DHCP автоматически выдаёт устройству сетевые параметры. Обычно это IP-адрес, маска подсети, шлюз и адреса DNS-серверов.',
    detail: 'Если DHCP недоступен, устройство может не получить корректные параметры. Но сама выдача IP-адреса не гарантирует доступ к интернету.',
    terminal: '$ ip route\ndefault via 192.168.10.1 dev eth0',
    question: 'Что является основной задачей DHCP?',
    answers: ['Назначать сетевые параметры автоматически', 'Шифровать все сайты', 'Охлаждать серверное оборудование'],
    correct: 0,
    hint: 'Вспомни, что получает новый компьютер, когда подключается к офисной сети.',
  },
  {
    id: 'dns',
    eyebrow: 'NET / 003',
    title: 'Зачем нужен DNS?',
    text: 'DNS позволяет находить IP-адреса по доменным именам. Например, браузеру проще обращаться к example.com, чем запоминать числовой адрес.',
    detail: 'Если соединение по IP работает, а по доменному имени — нет, одной из возможных причин является проблема с DNS.',
    terminal: '$ nslookup example.com\nName: example.com\nAddress: 93.184.215.14',
    question: 'Что делает DNS при запросе имени сайта?',
    answers: ['Устанавливает операционную систему', 'Выдаёт электропитание серверу', 'Сопоставляет доменное имя с IP-адресом'],
    correct: 2,
    hint: 'Подумай, как браузер узнаёт адрес сервера по имени сайта.',
  },
] as const

// Fixed positions keep the celebration consistent between renders.
const particles = [
  { x: -138, y: -90, r: -70, delay: 0.02, color: '#d7ff3f' },
  { x: -105, y: -138, r: 45, delay: 0.08, color: '#ffffff' },
  { x: -52, y: -115, r: 95, delay: 0.05, color: '#d7ff3f' },
  { x: 10, y: -155, r: 165, delay: 0, color: '#ffffff' },
  { x: 76, y: -122, r: -80, delay: 0.12, color: '#d7ff3f' },
  { x: 133, y: -70, r: 140, delay: 0.03, color: '#ffffff' },
  { x: -140, y: 25, r: 110, delay: 0.11, color: '#ffffff' },
  { x: -98, y: 84, r: -110, delay: 0.06, color: '#d7ff3f' },
  { x: -28, y: 116, r: 160, delay: 0.15, color: '#ffffff' },
  { x: 45, y: 103, r: -90, delay: 0.07, color: '#d7ff3f' },
  { x: 126, y: 43, r: 80, delay: 0.13, color: '#d7ff3f' },
  { x: 107, y: -145, r: -150, delay: 0.19, color: '#ffffff' },
]

function CorrectAnswerAnimation({
  lessonNumber,
  totalDone,
  firstTryScore,
  hasFullScore,
  fresh,
  reduceMotion,
}: {
  lessonNumber: number
  totalDone: number
  firstTryScore: number
  hasFullScore: boolean
  fresh: boolean
  reduceMotion: boolean
}) {
  const allDone = totalDone === lessons.length
  // Earlier completions did not save first-attempt accuracy, so do not invent a score.
  const resultTitle = !allDone
    ? (fresh ? 'Всё верно!' : 'Отличная работа!')
    : !hasFullScore
      ? 'База усвоена!'
      : firstTryScore === lessons.length
        ? 'Без ошибок!'
        : firstTryScore === lessons.length - 1
          ? 'Хороший результат!'
          : 'Есть что повторить'
  const resultDescription = !allDone
    ? `Вопрос ${String(lessonNumber).padStart(2, '0')} пройден. Продолжай в том же темпе.`
    : !hasFullScore
      ? 'Все три вводных вопроса пройдены. Можешь продолжить практику в лабораториях.'
      : firstTryScore === lessons.length
        ? 'Все 3 ответа верные с первой попытки. Отлично разобрался в основах сетей!'
        : firstTryScore === lessons.length - 1
          ? '2 из 3 ответов верны с первой попытки. Неплохой результат — повтори сложную тему.'
          : `${firstTryScore} из 3 ответов верны с первой попытки. Повтори темы и попробуй ещё раз.`

  return (
    <motion.div
      initial={reduceMotion || !fresh ? false : { opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0, y: -12 }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
      className="relative isolate mt-6 overflow-hidden border border-[#d7ff3f]/50 bg-[#d7ff3f]/[0.07] p-5 sm:p-6"
      role="status"
    >
      <div className="pointer-events-none absolute -right-14 -top-24 h-64 w-64 rounded-full bg-[#d7ff3f]/10 blur-3xl" />
      {fresh && !reduceMotion && (
        <>
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 border-2 border-[#d7ff3f]"
            initial={{ opacity: 0.95 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 1.3 }}
          />
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 w-24 -skew-x-12 bg-gradient-to-r from-transparent via-[#d7ff3f]/20 to-transparent"
            initial={{ left: '-28%' }}
            animate={{ left: '125%' }}
            transition={{ duration: 0.95, ease: 'easeOut', delay: 0.12 }}
          />
        </>
      )}
      {/* Particles spread across the whole success card, not just the 64px icon. */}
      {fresh && !reduceMotion && (
        <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden" aria-hidden="true">
              {particles.map((particle, index) => (
                <motion.span
                  key={index}
                  className="absolute left-1/2 top-[45%] h-[5px] w-[9px]"
                  style={{ background: particle.color }}
                  initial={{ x: -4, y: -4, scale: 0, opacity: 0, rotate: 0 }}
                  animate={{
                    x: particle.x,
                    y: particle.y,
                    scale: [0, 1, 1, 0.4],
                    opacity: [0, 1, 1, 0],
                    rotate: particle.r,
                  }}
                  transition={{ duration: 1.1, delay: particle.delay, ease: 'easeOut' }}
                  aria-hidden="true"
                />
              ))}
        </div>
      )}
      <div className="relative flex items-center gap-5">
        <div className="relative grid h-16 w-16 shrink-0 place-items-center">
          {fresh && !reduceMotion && (
            <>
              <motion.div
                className="absolute inset-1 rounded-full border border-[#d7ff3f]"
                initial={{ scale: 0.7, opacity: 0.8 }}
                animate={{ scale: 2.15, opacity: 0 }}
                transition={{ duration: 0.9, delay: 0.2 }}
              />
              <motion.div
                className="absolute inset-1 rounded-full border border-[#d7ff3f]"
                initial={{ scale: 0.7, opacity: 0.7 }}
                animate={{ scale: 1.75, opacity: 0 }}
                transition={{ duration: 0.85, delay: 0.36 }}
              />

            </>
          )}
          <motion.div
            className="relative z-20 grid h-14 w-14 place-items-center rounded-full bg-[#d7ff3f] text-[#101312]"
            initial={reduceMotion || !fresh ? false : { scale: 0, rotate: -60 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 340, damping: 16, delay: 0.09 }}
          >
            <Check size={29} strokeWidth={2.8} />
          </motion.div>
        </div>
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#d7ff3f]">
            <Sparkles size={13} /> {allDone ? 'Проверка завершена' : fresh ? 'Ответ подтверждён' : 'Ответ проверен'}
          </p>
          <h5 className="mt-2 font-display text-[clamp(1.5rem,2.6vw,2.1rem)] font-semibold leading-none tracking-[-0.04em] text-white">
            {resultTitle}
          </h5>
          <p className="mt-3 text-sm leading-6 text-white/60">
            {resultDescription}
          </p>
        </div>
      </div>
      <div className="relative mt-6 flex items-center gap-3 border-t border-[#d7ff3f]/20 pt-4">
        <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-[#d7ff3f]">{String(totalDone).padStart(2, '0')} / 03</span>
        <div className="h-1.5 flex-1 overflow-hidden bg-white/10">
          <motion.div
            className="h-full bg-[#d7ff3f]"
            initial={reduceMotion ? false : { width: '0%' }}
            animate={{ width: `${Math.min(totalDone, lessons.length) / lessons.length * 100}%` }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.8, delay: 0.2, ease: 'easeOut' }}
          />
        </div>
        <span className="shrink-0 font-mono text-[9px] uppercase tracking-wider text-white/45">пройдено</span>
      </div>
    </motion.div>
  )
}

// Smooth, lightweight transition between questions. No 3D rotations or page flipping.
// The outgoing lesson slides away while the new one fades in with a subtle blur.
const lessonVariants = {
  enter: (direction: number) => ({
    opacity: 0,
    x: direction * 38,
    filter: 'blur(7px)',
  }),
  center: {
    opacity: 1,
    x: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.48, ease: [0.16, 1, 0.3, 1] as const },
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction * -24,
    filter: 'blur(5px)',
    transition: { duration: 0.28, ease: [0.4, 0, 1, 1] as const },
  }),
}

function SmoothLessonTransition({
  children,
  reduceMotion,
}: {
  children: ReactNode
  reduceMotion: boolean
}) {
  const isPresent = useIsPresent()

  return (
    <motion.div
      variants={reduceMotion ? undefined : lessonVariants}
      initial={reduceMotion ? false : 'enter'}
      animate={reduceMotion ? { opacity: 1 } : 'center'}
      exit={reduceMotion ? { opacity: 0, transition: { duration: 0.1 } } : 'exit'}
      className="grid overflow-hidden border border-white/15 bg-[#101312] lg:grid-cols-2"
      style={{
        position: isPresent ? 'relative' : 'absolute',
        inset: isPresent ? undefined : 0,
        width: '100%',
        zIndex: isPresent ? 2 : 1,
        pointerEvents: isPresent ? 'auto' : 'none',
        willChange: reduceMotion ? 'auto' : 'transform, opacity, filter',
      }}
      aria-hidden={!isPresent}
    >
      {children}
    </motion.div>
  )
}

export function Learn() {
  const reduceMotion = useReducedMotion() === true
  const [active, setActive] = useState(0)
  const [direction, setDirection] = useState(1)
  const [selected, setSelected] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  // Completed lessons stay completed, but the student can choose to retry.
  const [replaying, setReplaying] = useState(false)
  const [completed, setCompleted] = usePersistentState<string[]>('syslab-learn-v1', [])
  // Records whether each question was answered correctly on the first try.
  const [firstTryResults, setFirstTryResults] = usePersistentState<Record<string, boolean>>('syslab-learn-first-try-v1', {})
  const lesson = lessons[active]
  const finishedCount = lessons.filter((item) => completed.includes(item.id)).length
  const firstTryScore = lessons.filter((item) => firstTryResults[item.id] === true).length
  const hasFullScore = lessons.every((item) => typeof firstTryResults[item.id] === 'boolean')
  const done = completed.includes(lesson.id)
  const solved = feedback === 'correct' || (done && !replaying && feedback === null)
  const answeredWrong = feedback === 'wrong'
  const isLast = active === lessons.length - 1

  const selectLesson = (index: number) => {
    if (index === active) return
    setDirection(index > active ? 1 : -1)
    setActive(index)
    setSelected(null)
    setFeedback(null)
    setReplaying(false)
  }

  const retryQuestion = () => {
    setSelected(null)
    setFeedback(null)
    setReplaying(true)
  }

  const checkAnswer = () => {
    if (selected === null || feedback !== null || solved) return
    const correct = selected === lesson.correct
    if (!done && firstTryResults[lesson.id] === undefined) {
      setFirstTryResults(prev => ({ ...prev, [lesson.id]: correct }))
    }
    setFeedback(correct ? 'correct' : 'wrong')
    if (correct && !done) setCompleted([...completed, lesson.id])
  }

  const mainAction = () => {
    if (solved) {
      selectLesson(isLast ? 0 : active + 1)
      return
    }
    if (answeredWrong) {
      retryQuestion()
      return
    }
    checkAnswer()
  }

  const buttonLabel = solved
    ? (isLast ? 'К первому вопросу' : 'Следующий вопрос')
    : answeredWrong ? 'Попробовать снова' : 'Проверить ответ'

  return (
    <section id="learn" className="relative overflow-hidden border-y border-white/10 bg-[#101312] px-5 py-24 text-white sm:px-8 sm:py-32 lg:px-12">
      <div className="pointer-events-none absolute -right-40 top-0 h-[500px] w-[500px] rounded-full bg-[#d7ff3f]/[0.035] blur-3xl" />
      <div className="relative mx-auto max-w-[1500px]">
        <div className="grid gap-7 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <div className="section-kicker"><span>LEARN</span> Интерактивный урок / Network fundamentals</div>
            <h2 className="mt-7 font-display text-[clamp(3rem,6vw,6.5rem)] font-medium leading-[0.95] tracking-[-0.065em]">
              Не запоминай.<br/><span className="text-[#d7ff3f]">Разбирайся.</span>
            </h2>
          </div>
          <div className="lg:col-span-4 lg:pb-3">
            <p className="max-w-sm text-sm leading-7 text-white/50">Три коротких интерактивных урока по сетям. Изучи принцип, ответь на вопрос и сохрани результат прямо в браузере.</p>
            <div className="mt-5 flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-white/50">
              <span className="text-[#d7ff3f]">{finishedCount} / 03</span>
              <div className="h-1 flex-1 overflow-hidden bg-white/10">
                <motion.div className="h-full bg-[#d7ff3f]" initial={false} animate={{ width: `${finishedCount / lessons.length * 100}%` }} transition={reduceMotion ? { duration: 0 } : { duration: 0.7 }} />
              </div>
              <span>пройдено</span>
            </div>
          </div>
        </div>

        <div className="mt-14 grid gap-3 md:grid-cols-3">
          {lessons.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => selectLesson(index)}
              aria-current={active === index ? 'step' : undefined}
              className={`flex min-h-20 items-center justify-between border px-5 py-5 text-left transition-colors ${active === index ? 'border-[#d7ff3f] bg-[#d7ff3f] text-black' : 'border-white/15 bg-white/[0.025] text-white hover:border-white/40'}`}
            >
              <div>
                <div className={`font-mono text-[9px] tracking-widest ${active === index ? 'text-black/55' : 'text-white/35'}`}>{item.eyebrow}</div>
                <div className="mt-2 font-display text-lg font-semibold tracking-tight">{item.id === 'ip' ? 'IP-адреса' : item.id === 'dhcp' ? 'DHCP' : 'DNS'}</div>
              </div>
              {completed.includes(item.id) ? <CheckCircle2 size={21} /> : <ArrowRight size={20} />}
            </button>
          ))}
        </div>

        <div className="relative mt-3">
          <AnimatePresence initial={false} custom={direction}>
            <SmoothLessonTransition key={lesson.id} reduceMotion={reduceMotion}>
            <div className="flex flex-col justify-between p-6 sm:p-9 lg:p-12">
              <div>
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-[#d7ff3f]"><BookOpen size={16} /> Теория / {lesson.eyebrow}</div>
                <h3 className="mt-9 font-display text-[clamp(2rem,4vw,3.6rem)] font-medium leading-none tracking-[-0.055em]">{lesson.title}</h3>
                <p className="mt-8 text-[15px] leading-8 text-white/70">{lesson.text}</p>
                <p className="mt-5 text-sm leading-7 text-white/45">{lesson.detail}</p>
              </div>
              <div className="mt-10 border border-white/10 bg-[#090b0a] p-5">
                <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest text-white/35"><Terminal size={15} /> Terminal / пример</div>
                <pre className="mt-5 overflow-x-auto whitespace-pre-wrap break-words font-mono text-[12px] leading-7 text-[#d7ff3f]">{lesson.terminal}</pre>
              </div>
            </div>

            <div className="relative flex flex-col justify-between overflow-hidden border-t border-white/15 bg-[#151a16] p-6 sm:p-9 lg:border-l lg:border-t-0 lg:p-12">
              <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 border border-[#d7ff3f]"
                initial={false}
                animate={{ opacity: feedback === 'correct' ? [0, 0.8, 0] : 0 }}
                transition={reduceMotion ? { duration: 0 } : { duration: 0.9 }}
              />
              <div className="relative">
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-white/45"><Network size={16} /> Проверка знаний</div>
                <div className="mt-8 font-mono text-[10px] uppercase tracking-widest text-[#d7ff3f]">QUESTION 0{active + 1} / 03</div>
                <h4 className="mt-4 font-display text-2xl font-medium leading-tight tracking-tight sm:text-3xl">{lesson.question}</h4>
                <div className="mt-8 grid gap-3" role="radiogroup" aria-label={lesson.question}>
                  {lesson.answers.map((answer, index) => {
                    const correctOption = solved && index === lesson.correct
                    const wrongOption = answeredWrong && selected === index
                    const pickedOption = selected === index && !solved && !answeredWrong
                    return (
                      <motion.button
                        key={answer}
                        type="button"
                        role="radio"
                        aria-checked={solved ? correctOption : selected === index}
                        disabled={solved || answeredWrong}
                        onClick={() => setSelected(index)}
                        animate={feedback === 'correct' && correctOption && !reduceMotion ? { scale: [1, 1.018, 1] } : { scale: 1 }}
                        transition={{ duration: 0.42 }}
                        className={`relative flex min-h-16 items-center gap-4 border px-4 py-4 text-left text-sm transition-colors disabled:cursor-default ${
                          correctOption ? 'border-[#d7ff3f] bg-[#d7ff3f]/15 text-white' :
                          wrongOption ? 'border-[#ffb98d] bg-[#ffb98d]/10 text-white' :
                          pickedOption ? 'border-[#d7ff3f] bg-[#d7ff3f]/10 text-white' :
                          'border-white/15 text-white/60 hover:border-white/40 hover:text-white'
                        }`}
                      >
                        <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border font-mono text-[10px] ${
                          correctOption || pickedOption ? 'border-[#d7ff3f] text-[#d7ff3f]' :
                          wrongOption ? 'border-[#ffb98d] text-[#ffb98d]' :
                          'border-white/25 text-white/35'
                        }`}>
                          {correctOption || pickedOption ? <Check size={13} /> : wrongOption ? <X size={13} /> : String.fromCharCode(65 + index)}
                        </span>
                        <span className="flex-1">{answer}</span>
                        {correctOption && <CheckCircle2 className="shrink-0 text-[#d7ff3f]" size={18} />}
                      </motion.button>
                    )
                  })}
                </div>

                <AnimatePresence mode="wait" initial={false}>
                  {solved ? (
                    <CorrectAnswerAnimation
                      key={`success-${lesson.id}-${feedback === 'correct' ? 'fresh' : 'saved'}`}
                      lessonNumber={active + 1}
                      totalDone={finishedCount}
                      firstTryScore={firstTryScore}
                      hasFullScore={hasFullScore}
                      fresh={feedback === 'correct'}
                      reduceMotion={reduceMotion}
                    />
                  ) : answeredWrong ? (
                    <motion.div
                      key="wrong"
                      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                      transition={reduceMotion ? { duration: 0 } : { duration: 0.3 }}
                      role="status"
                      className="mt-6 flex items-start gap-3 border border-[#ffb98d]/35 bg-[#ffb98d]/[0.06] p-5"
                    >
                      <CircleHelp className="mt-0.5 shrink-0 text-[#ffb98d]" size={20} />
                      <div>
                        <p className="font-display text-lg font-semibold text-[#ffb98d]">Почти! Попробуй ещё раз.</p>
                        <p className="mt-2 text-sm leading-6 text-white/60">{lesson.hint}</p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 flex min-h-11 items-center text-sm text-white/40">
                      Выбери один вариант и проверь свой ответ.
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="relative mt-6 flex flex-col gap-3 sm:flex-row">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.button
                    key={solved ? 'next' : answeredWrong ? 'retry' : 'check'}
                    type="button"
                    disabled={!solved && !answeredWrong && selected === null}
                    onClick={mainAction}
                    initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                    transition={reduceMotion ? { duration: 0 } : { duration: 0.22 }}
                    className={`group relative flex min-h-14 flex-1 items-center justify-center gap-3 overflow-hidden px-5 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                      answeredWrong ? 'border border-white/30 bg-transparent text-white hover:border-[#d7ff3f]' :
                      'bg-[#d7ff3f] text-black hover:bg-white'
                    }`}
                  >
                    <span className="relative z-10">{buttonLabel}</span>
                    {solved ? <ArrowRight size={17} className="relative z-10 transition-transform group-hover:translate-x-1" /> : answeredWrong ? <RotateCcw size={17} /> : <ArrowRight size={17} className="relative z-10" />}
                    {solved && feedback === 'correct' && !reduceMotion && (
                      <motion.span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-y-0 w-20 -skew-x-12 bg-white/40 blur-md"
                        initial={{ left: '-35%' }}
                        animate={{ left: '140%' }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                      />
                    )}
                  </motion.button>
                </AnimatePresence>
                {solved && (
                  <button
                    type="button"
                    onClick={retryQuestion}
                    className="flex min-h-14 items-center justify-center gap-2 border border-white/20 px-4 font-mono text-[10px] uppercase tracking-wider text-white/75 transition-colors hover:border-white/60 hover:text-white"
                  >
                    <RotateCcw size={14} /> Повторить вопрос
                  </button>
                )}
              </div>
            </div>
            </SmoothLessonTransition>
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {finishedCount === lessons.length && (
            <motion.div
              key="course-done"
              initial={reduceMotion ? false : { opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: 12 }}
              transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 120, damping: 22 }}
              className="relative mt-3 flex flex-col justify-between gap-6 overflow-hidden border border-[#d7ff3f]/40 bg-[#d7ff3f]/[0.045] p-6 sm:flex-row sm:items-center sm:p-9"
            >
              <div className="pointer-events-none absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent 0, transparent 32px, #d7ff3f 33px)' }} />
              <div className="relative flex items-center gap-4">
                <div className="grid h-14 w-14 shrink-0 place-items-center border border-[#d7ff3f]/60 text-[#d7ff3f]"><Trophy size={27} strokeWidth={1.4} /></div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#d7ff3f]">Network Fundamentals / проверка знаний</p>
                  <h3 className="mt-1 font-display text-xl font-semibold tracking-tight sm:text-2xl">03 / 03 — Проверка завершена</h3>
                </div>
              </div>
              <a href="#lab" className="relative flex min-h-12 items-center justify-center gap-2 border border-[#d7ff3f] px-5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#d7ff3f] transition-colors hover:bg-[#d7ff3f] hover:text-black">
                Перейти к лабораториям <ArrowRight size={16} />
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
