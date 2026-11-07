import { useEffect, useMemo, useRef, useState, type Dispatch, type KeyboardEvent, type SetStateAction } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Check, CheckCircle2, ChevronDown, Command, Download, Lightbulb, Play, RotateCcw, Server, TerminalSquare } from 'lucide-react'
import { commandSuggestions, createInitialState, executeCommand, isTaskComplete, scenarios, type LabState } from '../lib/labEngine'
import { usePersistentState } from '../hooks/usePersistentState'
import { Reveal } from './Reveal'

type LineTone = 'normal' | 'success' | 'error' | 'muted' | 'command' | 'system'
interface TerminalLine { id: number; text: string; tone: LineTone }

interface LabProps {
  activeId: string
  onActiveIdChange: (id: string) => void
  completed: Record<string, string[]>
  setCompleted: Dispatch<SetStateAction<Record<string, string[]>>>
}

const welcomeLines = (host: string): TerminalLine[] => [
  { id: -2, text: 'SYS/LAB SECURE SHELL · browser simulation · Ubuntu 24.04 LTS', tone: 'system' },
  { id: -1, text: `Сессия ${host} готова. Введите help для списка команд.`, tone: 'muted' },
]

export function Lab({ activeId, onActiveIdChange, completed, setCompleted }: LabProps) {
  const active = scenarios.find((scenario) => scenario.id === activeId) ?? scenarios[0]
  const [labStates, setLabStates] = usePersistentState<Record<string, LabState>>('syslab-lab-states-v1', {})
  const state: LabState = { ...createInitialState(), ...labStates[active.id] }
  const [logs, setLogs] = useState<TerminalLine[]>(() => welcomeLines(active.host))
  const [input, setInput] = useState('')
  const [histories, setHistories] = usePersistentState<Record<string, string[]>>('syslab-histories-v1', {})
  const [historyIndex, setHistoryIndex] = useState<number | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const lineId = useRef(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const logRef = useRef<HTMLDivElement>(null)
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const doneIds = completed[active.id] ?? []
  const currentTask = active.tasks.find((task) => !doneIds.includes(task.id)) ?? null
  const allDone = doneIds.length >= active.tasks.length
  const totalTasks = scenarios.reduce((sum, scenario) => sum + scenario.tasks.length, 0)
  const totalDone = scenarios.reduce((sum, scenario) => sum + Math.min(completed[scenario.id]?.length ?? 0, scenario.tasks.length), 0)
  const history = histories[active.id] ?? []
  const suggestions = useMemo(() => commandSuggestions(input), [input])

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setLogs(welcomeLines(active.host))
      setInput('')
      setShowHint(false)
      setHistoryIndex(null)
    })
    return () => cancelAnimationFrame(frame)
  }, [active.id, active.host])

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' })
  }, [logs])

  useEffect(() => () => {
    if (noticeTimer.current) clearTimeout(noticeTimer.current)
  }, [])

  const flashNotice = (message: string) => {
    setNotice(message)
    if (noticeTimer.current) clearTimeout(noticeTimer.current)
    noticeTimer.current = setTimeout(() => setNotice(null), 3400)
  }

  const runCommand = (raw = input) => {
    const command = raw.trim()
    if (!command) return
    const echo: TerminalLine = { id: lineId.current++, text: `${active.host}:${state.cwd === '/home/student' ? '~' : state.cwd.replace('/home/student/', '~/')}$ ${command}`, tone: 'command' }
    const result = executeCommand(command, state)
    setHistories((previous) => ({ ...previous, [active.id]: [...(previous[active.id] ?? []), command].slice(-60) }))
    setHistoryIndex(null)
    setInput('')

    if (result.clear) {
      setLogs([])
    } else {
      const outputLine: TerminalLine | null = result.output.length
        ? { id: lineId.current++, text: result.output.join('\n'), tone: result.tone ?? 'normal' }
        : null
      setLogs((previous) => [...previous, echo, ...(outputLine ? [outputLine] : [])].slice(-100))
    }

    setLabStates((previous) => ({ ...previous, [active.id]: result.state }))
    const achieved = active.tasks.filter((task) => isTaskComplete(task.condition, result.state)).map((task) => task.id)
    const previousDone = completed[active.id] ?? []
    const newlyDone = achieved.filter((id) => !previousDone.includes(id))
    if (newlyDone.length) {
      setShowHint(false)
      setCompleted((previous) => ({
        ...previous,
        [active.id]: Array.from(new Set([...(previous[active.id] ?? []), ...achieved])),
      }))
      const latestTask = active.tasks.find((task) => task.id === newlyDone[newlyDone.length - 1])
      const nextDoneCount = Array.from(new Set([...previousDone, ...achieved])).length
      flashNotice(nextDoneCount === active.tasks.length ? `Стенд пройден: ${active.title}` : `Задача зачтена: ${latestTask?.title ?? ''}`)
    }
  }

  const resetLab = () => {
    setLabStates((previous) => ({ ...previous, [active.id]: createInitialState() }))
    setCompleted((previous) => ({ ...previous, [active.id]: [] }))
    setLogs(welcomeLines(active.host))
    setHistories((previous) => ({ ...previous, [active.id]: [] }))
    setInput('')
    setShowHint(false)
    flashNotice('Стенд сброшен к исходному состоянию')
    inputRef.current?.focus()
  }

  const fillCommand = (command: string) => {
    setInput(command)
    requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.setSelectionRange(command.length, command.length)
    })
  }

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      runCommand()
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (!history.length) return
      const next = historyIndex === null ? history.length - 1 : Math.max(0, historyIndex - 1)
      setHistoryIndex(next)
      setInput(history[next])
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (historyIndex === null) return
      const next = historyIndex + 1
      if (next >= history.length) {
        setHistoryIndex(null)
        setInput('')
      } else {
        setHistoryIndex(next)
        setInput(history[next])
      }
    } else if (event.key === 'Tab' && suggestions.length) {
      event.preventDefault()
      setInput(suggestions[0])
    } else if (event.key === 'Escape') {
      setInput('')
      setShowHint(false)
    }
  }

  const downloadReport = () => {
    const report = [
      '# SYS/LAB — отчёт о практике',
      '',
      `**Стенд:** ${active.number} · ${active.title}`,
      `**Хост:** ${active.host}`,
      `**Дата экспорта:** ${new Date().toLocaleString('ru-RU')}`,
      `**Результат:** ${doneIds.length}/${active.tasks.length} задач`,
      '',
      '## Задачи',
      ...active.tasks.map((task) => `- [${doneIds.includes(task.id) ? 'x' : ' '}] ${task.title} — ${task.description}`),
      '',
      '## История shell',
      '```bash',
      ...(history.length ? history : ['# Команды ещё не выполнялись']),
      '```',
      '',
      '## Финальное состояние модели',
      '```json',
      JSON.stringify(state, null, 2),
      '```',
      '',
      'SYS/LAB · DON\'T JUST LEARN IT. BUILD IT.',
    ].join('\n')
    const blob = new Blob([report], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `syslab-${active.id}-report.md`
    anchor.click()
    URL.revokeObjectURL(url)
    flashNotice('Отчёт Markdown сохранён')
  }

  return (
    <section id="lab" className="lab-grid relative bg-[#0c0f0e] px-5 py-24 sm:px-8 sm:py-32 lg:px-12 lg:py-40">
      <div className="mx-auto max-w-[1600px]">
        <Reveal>
          <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8">
              <div className="section-kicker"><span>03</span> Интерактивная лаборатория</div>
              <h2 className="mt-6 font-display text-[clamp(3rem,6.7vw,7rem)] font-medium leading-[0.88] tracking-[-0.065em]">Не смотрите.<br /><span className="text-[#d7ff3f]">Введите команду.</span></h2>
            </div>
            <div className="lg:col-span-4 lg:pb-2">
              <p className="max-w-md text-[15px] leading-relaxed text-white/50">Три изолированных сценария с настоящей логикой состояния. Команды, ошибки и результат — всё зависит от ваших действий.</p>
              <div className="mt-6 flex items-center gap-4 font-mono text-[9px] uppercase tracking-[0.14em] text-white/40">
                <span>Общий прогресс</span><div className="h-px flex-1 bg-white/15"><div className="h-px bg-[#d7ff3f] transition-all duration-700" style={{ width: `${(totalDone / totalTasks) * 100}%` }} /></div><span className="text-[#d7ff3f]">{totalDone}/{totalTasks}</span>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1} className="mt-14 lg:mt-20">
          <div className="grid border-x border-t border-white/15 md:grid-cols-3">
            {scenarios.map((scenario) => {
              const count = Math.min(completed[scenario.id]?.length ?? 0, scenario.tasks.length)
              const selected = scenario.id === active.id
              return (
                <button key={scenario.id} onClick={() => onActiveIdChange(scenario.id)} className={`group relative border-b border-white/15 p-5 text-left transition-colors sm:p-6 md:border-b-0 md:[&:not(:last-child)]:border-r ${selected ? 'bg-white/[0.055]' : 'hover:bg-white/[0.025]'}`}>
                  {selected && <motion.div layoutId="scenario-active" className="absolute inset-x-0 top-0 h-0.5 bg-[#d7ff3f]" />}
                  <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.14em]"><span className={selected ? 'text-[#d7ff3f]' : 'text-white/35'}>LAB_{scenario.number} / {scenario.category}</span>{count === scenario.tasks.length && <CheckCircle2 size={15} className="text-[#d7ff3f]" />}</div>
                  <h3 className="mt-4 font-display text-xl font-medium tracking-tight text-white/85 sm:text-2xl">{scenario.title}</h3>
                  <div className="mt-5 flex items-center justify-end font-mono text-[11px] uppercase tracking-widest text-white/50"><span className={count ? 'text-white/70' : ''}>{count}/{scenario.tasks.length}</span></div>
                </button>
              )
            })}
          </div>

          <div className="border border-white/15 bg-[#090b0a] shadow-[0_35px_100px_rgba(0,0,0,0.35)]">
            <div className="flex min-h-12 flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.10em] text-white/50 sm:px-5">
              <div className="flex items-center gap-3"><span className="flex gap-1.5"><i className="h-2 w-2 rounded-full bg-white/15" /><i className="h-2 w-2 rounded-full bg-white/15" /><i className="h-2 w-2 rounded-full bg-[#d7ff3f]/70" /></span><span className="hidden sm:inline">{active.host}</span></div>
              <div className="flex items-center gap-4"><span className="flex items-center gap-1.5 text-[#d7ff3f]"><span className="h-1 w-1 animate-pulse rounded-full bg-current" /> simulator online</span><button onClick={downloadReport} className="flex items-center gap-1.5 transition-colors hover:text-white" title="Скачать отчёт Markdown"><Download size={12} /> <span className="hidden sm:inline">Отчёт</span></button><button onClick={resetLab} className="flex items-center gap-1.5 transition-colors hover:text-white" title="Сбросить текущий стенд"><RotateCcw size={12} /> <span className="hidden sm:inline">Сброс</span></button></div>
            </div>

            <div className="grid lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[290px_minmax(0,1fr)_260px]">
              <aside className="border-b border-white/10 lg:border-b-0 lg:border-r">
                <div className="border-b border-white/10 p-5">
                  <span className="font-mono text-[8px] uppercase tracking-[0.17em] text-[#d7ff3f]">Задача / {active.number}</span>
                  <p className="mt-3 text-xs leading-relaxed text-white/45">{active.brief}</p>
                </div>
                <div>
                  {active.tasks.map((task, index) => {
                    const done = doneIds.includes(task.id)
                    const current = currentTask?.id === task.id
                    const expanded = current && showHint
                    return (
                      <div key={task.id} className={`border-b border-white/10 last:border-b-0 ${current ? 'bg-white/[0.035]' : ''}`}>
                        <button onClick={() => current ? setShowHint((value) => !value) : fillCommand(task.command)} className="flex w-full items-start gap-3 p-4 text-left" title={current ? 'Показать детали и подсказку' : 'Подставить команду задачи'}>
                          <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border ${done ? 'border-[#d7ff3f] bg-[#d7ff3f] text-black' : current ? 'border-[#d7ff3f] text-[#d7ff3f]' : 'border-white/20 text-white/30'}`}>
                            {done ? <Check size={12} strokeWidth={2.5} /> : <span className="font-mono text-[8px]">{index + 1}</span>}
                          </span>
                          <span className="min-w-0 flex-1"><span className={`block text-xs font-medium ${done ? 'text-white/35 line-through decoration-white/20' : current ? 'text-white' : 'text-white/55'}`}>{task.title}</span>{current && <span className="mt-1.5 block text-[11px] leading-relaxed text-white/40">{task.description}</span>}</span>
                          {current && <ChevronDown size={13} className={`mt-1 shrink-0 text-white/35 transition-transform ${showHint ? 'rotate-180' : ''}`} />}
                        </button>
                        <AnimatePresence initial={false}>
                          {current && expanded && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                              <div className="mx-4 mb-4 border border-[#d7ff3f]/15 bg-[#d7ff3f]/[0.04] p-3">
                                <div className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-wider text-[#d7ff3f]"><Lightbulb size={12} />Подсказка</div>
                                <p className="mt-2 text-[11px] leading-relaxed text-white/50">{task.hint}</p>
                                <button onClick={() => fillCommand(task.command)} className="mt-3 flex max-w-full items-center gap-2 font-mono text-[9px] text-white/75 transition-colors hover:text-[#d7ff3f]"><Command size={11} className="shrink-0" /><span className="truncate">{task.command}</span><ArrowRight size={11} className="shrink-0" /></button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  })}
                </div>
              </aside>

              <div className="relative flex min-w-0 flex-col bg-[#070908]">
                <div ref={logRef} className="terminal-scroll h-[390px] overflow-y-auto p-4 font-mono text-[14px] leading-[1.7] sm:h-[440px] sm:p-6 sm:text-[15px] xl:h-[500px]" aria-live="polite" onClick={() => inputRef.current?.focus()}>
                  {logs.map((line) => (
                    <pre key={line.id} className={`mb-2 whitespace-pre-wrap break-words font-mono ${line.tone === 'command' ? 'mb-1 mt-4 text-white first:mt-0' : line.tone === 'error' ? 'text-[#ff8d7a]' : line.tone === 'success' ? 'text-[#d7ff3f]' : line.tone === 'system' ? 'text-[#d7ff3f]/70' : line.tone === 'muted' ? 'text-white/35' : 'text-white/65'}`}>{line.text}</pre>
                  ))}
                  {logs.length === 0 && <div className="text-white/25">Экран очищен. Состояние системы сохранено.</div>}
                </div>

                <AnimatePresence>
                  {allDone && (
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mx-4 mb-3 flex flex-col gap-3 border border-[#d7ff3f]/25 bg-[#d7ff3f]/[0.06] p-4 sm:mx-6 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3"><CheckCircle2 size={20} className="shrink-0 text-[#d7ff3f]" /><div><div className="font-mono text-[10px] uppercase tracking-wider text-[#d7ff3f]">Система готова</div><div className="mt-1 text-[11px] text-white/40">Все проверки пройдены · +{active.tasks.length * 100} XP</div></div></div>
                      <button onClick={downloadReport} className="flex w-fit items-center gap-2 border border-[#d7ff3f]/30 px-3 py-2 font-mono text-[8px] uppercase tracking-wider text-[#d7ff3f] hover:bg-[#d7ff3f] hover:text-black"><Download size={12} />Скачать результат</button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="relative mt-auto border-t border-white/10 bg-[#0b0e0d] p-3 sm:p-4">
                  <AnimatePresence>
                    {suggestions.length > 0 && (
                      <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="absolute inset-x-3 bottom-full mb-2 border border-white/15 bg-[#111513] p-1 shadow-xl sm:inset-x-4">
                        {suggestions.map((suggestion, index) => <button key={suggestion} onClick={() => fillCommand(suggestion)} className="flex w-full items-center justify-between gap-4 px-3 py-2 text-left font-mono text-[12px] text-white/65 hover:bg-white/5 hover:text-white"><span className="truncate">{suggestion}</span>{index === 0 && <span className="shrink-0 text-[10px] text-white/35">TAB</span>}</button>)}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="hidden shrink-0 font-mono text-[14px] text-[#d7ff3f] sm:block">{active.host.split('@')[0]}:<span className="text-white/45">{state.cwd === '/home/student' ? '~' : state.cwd.replace('/home/student/', '~/')}</span>$</span>
                    <TerminalSquare size={16} className="shrink-0 text-[#d7ff3f] sm:hidden" />
                    <input id="lab-command" ref={inputRef} value={input} onChange={(event) => { setInput(event.target.value); setHistoryIndex(null) }} onKeyDown={onInputKeyDown} className="min-w-0 flex-1 bg-transparent py-3 font-mono text-[15px] text-white caret-[#d7ff3f] outline-none placeholder:text-white/30 sm:text-[16px]" placeholder="Введите команду…" autoComplete="off" autoCapitalize="off" spellCheck={false} aria-label="Командная строка виртуального стенда" />
                    <button onClick={() => runCommand()} disabled={!input.trim()} className="grid h-10 w-10 shrink-0 place-items-center bg-[#d7ff3f] text-black transition-all hover:bg-white disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/25" aria-label="Выполнить команду"><Play size={15} fill="currentColor" /></button>
                  </div>
                  <div className="mt-1 flex items-center justify-between font-mono text-[9px] uppercase tracking-wider text-white/35"><span>ENTER — RUN · ↑↓ — HISTORY · TAB — COMPLETE</span><span>UTF-8 / BASH</span></div>
                </div>

                <AnimatePresence>
                  {notice && (
                    <motion.div initial={{ opacity: 0, y: 20, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: 10, x: '-50%' }} className="absolute bottom-24 left-1/2 z-20 flex w-max max-w-[90%] items-center gap-2 border border-[#d7ff3f]/30 bg-[#171d12] px-4 py-3 font-mono text-[9px] uppercase tracking-wider text-[#d7ff3f] shadow-2xl"><CheckCircle2 size={14} className="shrink-0" />{notice}</motion.div>
                  )}
                </AnimatePresence>
              </div>

              <aside className="border-t border-white/10 lg:col-span-2 xl:col-span-1 xl:border-l xl:border-t-0">
                <div className="grid sm:grid-cols-2 xl:block">
                  <div className="border-b border-white/10 p-5 sm:border-r xl:border-r-0">
                    <div className="flex items-center justify-between font-mono text-[8px] uppercase tracking-[0.16em] text-white/35"><span>System state</span><Server size={13} /></div>
                    <div className="mt-5 space-y-4">
                      <StateRow label="HOST" value={active.host.split('@')[1]} />
                      <StateRow label="KERNEL" value="Linux 6.8.0" />
                      {active.id === 'linux' && <StateRow label="WORKSPACE" value={state.readmeCreated ? 'READY' : state.directories.includes('/home/student/projects') ? 'CREATED' : 'EMPTY'} ok={state.readmeCreated} />}
                      {active.id === 'network' && <><StateRow label="ETH0" value="10.10.20.14/24" ok /><StateRow label="DEFAULT ROUTE" value={state.gatewayConfigured ? '10.10.20.1' : 'MISSING'} ok={state.gatewayConfigured} /><StateRow label="WAN" value={state.externalPing ? 'REACHABLE' : 'UNVERIFIED'} ok={state.externalPing} /></>}
                      {active.id === 'service' && <><StateRow label="NGINX" value={state.nginxRunning ? 'ACTIVE' : 'FAILED'} ok={state.nginxRunning} /><StateRow label="HTTP :80" value={state.httpChecked ? '200 OK' : 'NO RESPONSE'} ok={state.httpChecked} /><StateRow label="SOCKET" value={state.portsInspected ? 'LISTENING' : 'UNVERIFIED'} ok={state.portsInspected} /></>}
                    </div>
                  </div>
                  <div className="border-b border-white/10 p-5">
                    <div className="font-mono text-[8px] uppercase tracking-[0.16em] text-white/35">Topology</div>
                    <svg viewBox="0 0 210 100" className="mt-4 w-full" role="img" aria-label="Текущая топология стенда">
                      <path d="M30 50H180" stroke="#ffffff20" />
                      <motion.path d="M30 50H180" stroke="#d7ff3f" strokeWidth="1.2" strokeDasharray="2 12" className="packet-flow" animate={{ opacity: active.id === 'network' && !state.gatewayConfigured ? 0.15 : 0.8 }} />
                      {[{ x: 30, name: 'HOST' }, { x: 105, name: active.id === 'service' ? 'NGINX' : 'NODE' }, { x: 180, name: active.id === 'service' ? 'HTTP' : 'WAN' }].map((node, index) => {
                        const healthy = active.id === 'linux' || (active.id === 'network' ? index < 2 || state.externalPing : index === 0 || state.nginxRunning)
                        return <g key={node.name} transform={`translate(${node.x} 50)`}><circle r="15" fill="#090b0a" stroke={healthy ? '#d7ff3f' : '#ff8d7a'} strokeOpacity={healthy ? 0.7 : 0.5} /><rect x="-4" y="-4" width="8" height="8" fill="none" stroke={healthy ? '#d7ff3f' : '#ff8d7a'} /><text y="30" textAnchor="middle" fill="#ffffff60" fontSize="6" fontFamily="monospace">{node.name}</text></g>
                      })}
                    </svg>
                  </div>
                </div>
                <div className="grid grid-cols-2 divide-x divide-white/10 border-b border-white/10 xl:border-b-0">
                  <div className="p-5"><span className="block font-display text-3xl tracking-tight">{state.commandCount}</span><span className="mt-1 block font-mono text-[7px] uppercase tracking-widest text-white/30">команд в сессии</span></div>
                  <div className="p-5"><span className="block font-display text-3xl tracking-tight text-[#d7ff3f]">{doneIds.length * 100}</span><span className="mt-1 block font-mono text-[7px] uppercase tracking-widest text-white/30">XP за стенд</span></div>
                </div>
              </aside>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2 font-mono text-[8px] uppercase leading-relaxed tracking-[0.1em] text-white/25 sm:flex-row sm:items-center sm:justify-between"><span>Безопасная браузерная модель Linux · не требует установки</span><span>state-driven simulation / persistent progress</span></div>
        </Reveal>
      </div>
    </section>
  )
}

function StateRow({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 font-mono text-[8px] uppercase tracking-wider">
      <span className="text-white/30">{label}</span>
      <span className={`flex items-center gap-1.5 text-right ${ok === undefined ? 'text-white/65' : ok ? 'text-[#d7ff3f]' : 'text-[#ff8d7a]'}`}>{ok !== undefined && <span className="h-1 w-1 rounded-full bg-current" />}{value}</span>
    </div>
  )
}
