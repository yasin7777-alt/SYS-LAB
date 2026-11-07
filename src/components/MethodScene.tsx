import { useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { AlertTriangle, ArrowDownRight, Check, Cpu, Network, TerminalSquare } from 'lucide-react'

const stages = [
  {
    word: 'UNDERSTAND.',
    index: '01',
    kicker: 'THEORY / СИСТЕМА',
    title: 'Система — это связи, а не список команд.',
    text: 'Разбираем, как запрос проходит через shell, kernel, сеть и службу. Теория даёт модель, а не готовый ответ.',
    note: 'Визуальные карты вместо конспектов на 80 страниц',
  },
  {
    word: 'BUILD.',
    index: '02',
    kicker: 'PRACTICE / КОНФИГУРАЦИЯ',
    title: 'Соберите каждую связь своими руками.',
    text: 'Назначайте адреса, поднимайте службы и связывайте узлы. Каждая команда меняет состояние виртуального стенда.',
    note: 'Не выбор ответа — настоящая последовательность действий',
  },
  {
    word: 'RECOVER.',
    index: '03',
    kicker: 'INCIDENT / ДИАГНОСТИКА',
    title: 'Сломайте. Найдите. Восстановите.',
    text: 'Инцидент — лучший преподаватель. Читайте симптомы, проверяйте гипотезы и доказывайте восстановление метриками.',
    note: 'Результат — не “пройдено”, а работающая инфраструктура',
  },
]

export function MethodScene() {
  const ref = useRef<HTMLElement>(null)
  const [stage, setStage] = useState(0)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const backgroundColor = useTransform(scrollYProgress, [0, 0.28, 0.48, 0.7, 1], ['#eceee8', '#eceee8', '#d7ff3f', '#101312', '#101312'])
  const color = useTransform(scrollYProgress, [0, 0.28, 0.48, 0.7, 1], ['#111311', '#111311', '#111311', '#f0f1ec', '#f0f1ec'])

  useMotionValueEvent(scrollYProgress, 'change', (value) => {
    const next = value < 0.32 ? 0 : value < 0.65 ? 1 : 2
    if (next !== stage) setStage(next)
  })

  const goToStage = (index: number) => {
    if (!ref.current) return
    const top = ref.current.getBoundingClientRect().top + window.scrollY
    const travel = ref.current.offsetHeight - window.innerHeight
    window.scrollTo({ top: top + travel * [0.05, 0.48, 0.88][index], behavior: 'smooth' })
  }

  if (reduced) {
    return (
      <section id="method" ref={ref} className="bg-[#101312] px-5 py-24 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1500px]">
          <div className="grid gap-5 lg:grid-cols-3">
            {stages.map((item, index) => (
              <div key={item.word} className={`p-7 ${index === 1 ? 'bg-[#d7ff3f] text-black' : index === 0 ? 'bg-[#eceee8] text-black' : 'border border-white/15 text-white'}`}>
                <span className="font-mono text-[10px]">{item.index} / {item.kicker}</span>
                <h2 className="mt-10 font-display text-4xl leading-none tracking-[-0.05em]">{item.word}</h2>
                <p className="mt-7 text-xl font-medium leading-snug">{item.title}</p>
                <p className="mt-4 text-sm leading-relaxed opacity-60">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <motion.section id="method" ref={ref} className="relative h-[320vh]" style={{ backgroundColor, color }}>
      <div className="sticky top-0 flex h-[100svh] min-h-[680px] flex-col overflow-hidden px-5 py-7 sm:px-8 lg:px-12 lg:py-9">
        <div className="mx-auto flex w-full max-w-[1500px] items-center justify-end gap-6 border-b border-current/15 pb-5 font-mono text-[9px] uppercase tracking-[0.18em]">
          <span>{String(stage + 1).padStart(2, '0')} — 03</span>
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-[16%] select-none overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div key={stages[stage].word} initial={{ y: '70%', opacity: 0 }} animate={{ y: 0, opacity: 0.1 }} exit={{ y: '-55%', opacity: 0 }} transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }} className="whitespace-nowrap text-center font-display text-[clamp(5rem,15.5vw,16rem)] font-semibold leading-none tracking-[-0.08em]">
              {stages[stage].word}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="relative z-10 mx-auto grid w-full max-w-[1500px] flex-1 items-center gap-8 py-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5">
            <AnimatePresence mode="wait">
              <motion.div key={stage} initial={{ opacity: 0, y: 35 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -25 }} transition={{ duration: 0.48, ease: [0.16, 1, 0.3, 1] }}>
                <div className="flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.17em]"><ArrowDownRight size={16} />{stages[stage].kicker}</div>
                <h2 className="mt-6 max-w-[570px] font-display text-[clamp(2.5rem,4.7vw,5rem)] font-medium leading-[0.94] tracking-[-0.06em]">{stages[stage].title}</h2>
                <p className="mt-6 max-w-[470px] text-[15px] leading-[1.75] opacity-60">{stages[stage].text}</p>
                <div className="mt-7 flex max-w-[470px] items-start gap-3 border-t border-current/20 pt-5 font-mono text-[9px] uppercase leading-relaxed tracking-[0.1em] opacity-60">
                  {stage === 2 ? <Check size={15} className="shrink-0 text-[#d7ff3f]" /> : <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-current" />}
                  {stages[stage].note}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="hidden lg:col-span-7 lg:block">
            <StageVisual stage={stage} />
          </div>
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-[1500px] items-center justify-between gap-5 border-t border-current/15 pt-5">
          <div className="flex gap-2">
            {stages.map((item, index) => (
              <button key={item.word} onClick={() => goToStage(index)} className={`h-8 px-3 font-mono text-[9px] transition-all ${stage === index ? 'bg-current text-[#101312] invert-0' : 'opacity-35 hover:opacity-70'}`} aria-label={`Перейти к этапу ${index + 1}`}>
                <span className="mix-blend-difference text-white">{item.index}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 font-sans text-[11px] font-medium tracking-[-0.01em] text-white/60 sm:text-[12px]">
            <span>THEORY</span>
            <span className="h-1.5 w-1.5 rounded-full bg-white/95" aria-hidden="true" />
            <span>PRACTICE</span>
            <span className="h-1.5 w-1.5 rounded-full bg-white/95" aria-hidden="true" />
            <span>RECOVERY</span>
          </div>
        </div>
      </div>
    </motion.section>
  )
}

function StageVisual({ stage }: { stage: number }) {
  const nodes = stage === 0
    ? [
        { x: 15, y: 50, label: 'SHELL', sub: 'user space', icon: 'terminal' },
        { x: 50, y: 50, label: 'KERNEL', sub: 'system call', icon: 'cpu' },
        { x: 85, y: 50, label: 'SERVICE', sub: 'response', icon: 'network' },
      ]
    : [
        { x: 12, y: 50, label: 'CLIENT', sub: '10.10.20.14', icon: 'terminal' },
        { x: 38, y: 25, label: 'GATEWAY', sub: stage === 2 ? 'route restored' : '10.10.20.1', icon: 'network' },
        { x: 65, y: 70, label: 'NGINX', sub: stage === 2 ? 'active / 200 OK' : 'port :80', icon: 'cpu' },
        { x: 88, y: 40, label: 'WAN', sub: stage === 2 ? '0% packet loss' : '1.1.1.1', icon: 'network' },
      ]

  return (
    <div className="relative aspect-[1.25/1] w-full border border-current/20 bg-current/[0.025]">
      <div className="absolute left-5 top-5 font-mono text-[8px] uppercase tracking-widest opacity-45">SYSTEM MAP / LIVE MODEL</div>
      <div className="absolute right-5 top-5 flex items-center gap-2 font-mono text-[8px] uppercase tracking-widest opacity-45"><span className={`h-1.5 w-1.5 rounded-full ${stage === 2 ? 'bg-[#d7ff3f]' : 'bg-current'}`} />{stage === 0 ? 'read only' : stage === 1 ? 'configuring' : 'verified'}</div>
      <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="none" aria-hidden="true">
        {stage > 0 && <><path d="M12 50 L38 25 L88 40" fill="none" stroke="currentColor" strokeOpacity=".3" strokeWidth=".18" vectorEffect="non-scaling-stroke" /><path d="M12 50 L65 70 L88 40" fill="none" stroke="currentColor" strokeOpacity=".3" strokeWidth=".18" vectorEffect="non-scaling-stroke" /><path d="M38 25 L65 70" fill="none" stroke="currentColor" strokeOpacity=".12" strokeWidth=".18" strokeDasharray="1 1" vectorEffect="non-scaling-stroke" /></>}
        {stage === 0 && <path d="M15 50H85" fill="none" stroke="currentColor" strokeOpacity=".35" strokeWidth=".18" vectorEffect="non-scaling-stroke" />}
        <motion.path key={`flow-${stage}`} d={stage === 0 ? 'M15 50H85' : 'M12 50 L38 25 L88 40'} fill="none" stroke={stage === 2 ? '#d7ff3f' : 'currentColor'} strokeWidth=".35" strokeDasharray="2 5" vectorEffect="non-scaling-stroke" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 1.1, ease: 'easeInOut' }} className="packet-flow" />
      </svg>
      <AnimatePresence mode="popLayout">
        {nodes.map((node, index) => (
          <motion.div key={`${stage}-${node.label}`} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${node.x}%`, top: `${node.y}%` }} initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }} transition={{ delay: index * 0.1, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}>
            <div className={`relative grid h-[74px] w-[74px] place-items-center border bg-[#101312] text-[#f0f1ec] ${stage === 2 && node.label === 'GATEWAY' ? 'border-[#d7ff3f] shadow-[0_0_30px_rgba(215,255,63,0.15)]' : 'border-current/30'}`}>
              {node.icon === 'terminal' ? <TerminalSquare size={23} strokeWidth={1.3} /> : node.icon === 'cpu' ? <Cpu size={23} strokeWidth={1.3} /> : <Network size={23} strokeWidth={1.3} />}
              {stage === 2 && node.label === 'GATEWAY' && <AlertTriangle size={13} className="absolute -right-2 -top-2 bg-[#101312] text-[#d7ff3f]" />}
            </div>
            <div className="mt-3 whitespace-nowrap text-center font-mono text-[8px] uppercase tracking-wider"><strong className="block font-normal">{node.label}</strong><span className="mt-1 block opacity-45">{node.sub}</span></div>
          </motion.div>
        ))}
      </AnimatePresence>
      <div className="absolute bottom-5 left-5 right-5 flex justify-between border-t border-current/15 pt-4 font-mono text-[8px] uppercase tracking-widest opacity-45"><span>{stage === 0 ? '3 layers connected' : stage === 1 ? '4 nodes / 5 links' : 'incident #0042 resolved'}</span><span>SYS/LAB ©</span></div>
    </div>
  )
}
