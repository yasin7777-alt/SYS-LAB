import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUpRight, ChevronDown, ShieldCheck } from 'lucide-react'
import { Reveal } from './Reveal'

interface AboutProps {
  completedCount: number
  totalTasks: number
  planCount: number
  onContinue: () => void
}

const principles = [
  { number: '01', title: 'Контекст перед синтаксисом', text: 'Сначала вы понимаете, почему сервис не отвечает. Затем — какая команда поможет это доказать.' },
  { number: '02', title: 'Ошибка — часть задания', text: 'Стенд не выдаёт балл за угаданный вариант. Он реагирует на неверный адрес, порядок действий и состояние системы.' },
  { number: '03', title: 'Проверка после изменения', text: 'Рестарт — не финал. Нужен HTTP 200, listening socket или успешный ICMP. Так вырабатывается инженерная дисциплина.' },
]

const faq = [
  { q: 'Нужен ли опыт администрирования?', a: 'Для трека Linux Engineering — нет: он начинается с устройства shell и файловой системы. Network Systems и Windows Infrastructure требуют базовой компьютерной грамотности, а Virtual Infrastructure лучше проходить после Linux и сетей. В каждой лаборатории есть контекстные подсказки.' },
  { q: 'Это настоящие удалённые серверы?', a: 'Три сценария на этой странице работают в безопасной браузерной модели Linux. Команды не отправляются на внешний сервер: симулятор интерпретирует их и изменяет состояние файлов, маршрутов и служб. Поэтому можно экспериментировать и сбрасывать стенд без риска.' },
  { q: 'Где хранятся мой план и прогресс?', a: 'Только в localStorage этого браузера. Мы не создаём аккаунт и не передаём ваши результаты на сервер. Сброс отдельного стенда удаляет его зачтенные задачи; очистка данных браузера удаляет весь локальный прогресс.' },
  { q: 'Можно ли получить результат работы?', a: 'Да. В панели лаборатории нажмите «Отчёт»: SYS/LAB сформирует Markdown-файл со списком задач, историей введённых команд и финальным состоянием модели. Его можно сохранить в заметках или добавить в учебный репозиторий.' },
  { q: 'Что делать, если я застрял?', a: 'Откройте текущую задачу в левой панели и разверните подсказку. Клик по примеру подставит команду в терминал, но не выполнит её за вас. Команда help показывает доступные инструменты, а клавиша Tab — автодополнение.' },
]

export function About({ completedCount, totalTasks, planCount, onContinue }: AboutProps) {
  const [openFaq, setOpenFaq] = useState(0)
  const progress = Math.round((completedCount / totalTasks) * 100)
  const circumference = 2 * Math.PI * 58

  return (
    <section id="about" className="bg-[#eceee8] text-[#111311]">
      <div className="px-5 py-24 sm:px-8 sm:py-32 lg:px-12 lg:py-40">
        <div className="mx-auto max-w-[1500px]">
          <Reveal>
            <div className="section-kicker !border-black/20 !text-black/50"><span className="!text-black">04</span> Философия платформы</div>
            <h2 className="mt-8 max-w-[1300px] font-display text-[clamp(2.75rem,7.2vw,7.6rem)] font-medium leading-[0.91] tracking-[-0.07em]">Знание заканчивается там,<br className="hidden sm:block" /> <span className="text-black/30">где начинается</span> терминал.</h2>
          </Reveal>

          <div className="mt-20 grid gap-12 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-7">
              <div className="border-t border-black/20">
                {principles.map((principle, index) => (
                  <Reveal key={principle.number} delay={index * 0.08}>
                    <div className="grid gap-4 border-b border-black/15 py-8 sm:grid-cols-[70px_1fr] sm:py-10">
                      <span className="font-mono text-[10px] text-black/40">/{principle.number}</span>
                      <div><h3 className="font-display text-2xl font-medium tracking-[-0.035em] sm:text-3xl">{principle.title}</h3><p className="mt-4 max-w-[590px] text-sm leading-[1.8] text-black/50">{principle.text}</p></div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>

            <Reveal className="lg:col-span-5 lg:pl-10" delay={0.12}>
              <div className="relative overflow-hidden bg-[#111412] p-7 text-white sm:p-9">
                <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full border border-[#d7ff3f]/10" />
                <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full border border-[#d7ff3f]/10" />
                <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.16em] text-white/40"><span>Ваш локальный контур</span><ShieldCheck size={15} className="text-[#d7ff3f]" /></div>
                <div className="mt-9 flex flex-col items-start gap-7 min-[420px]:flex-row min-[420px]:items-center">
                  <div className="relative h-36 w-36 shrink-0">
                    <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
                      <circle cx="64" cy="64" r="58" fill="none" stroke="#ffffff12" strokeWidth="3" />
                      <motion.circle cx="64" cy="64" r="58" fill="none" stroke="#d7ff3f" strokeWidth="3" strokeLinecap="butt" strokeDasharray={circumference} initial={false} animate={{ strokeDashoffset: circumference * (1 - progress / 100) }} transition={{ duration: 0.8 }} />
                    </svg>
                    <div className="absolute inset-0 grid place-items-center"><span className="font-display text-4xl tracking-[-0.06em]">{progress}<span className="text-lg text-white/35">%</span></span></div>
                  </div>
                  <div><span className="font-mono text-[9px] uppercase tracking-widest text-white/35">Lab progress</span><p className="mt-2 max-w-[140px] text-sm leading-relaxed text-white/55">{completedCount === 0 ? 'Первая команда меняет всё.' : completedCount === totalTasks ? 'Все доступные стенды пройдены.' : 'Система ждёт следующего действия.'}</p></div>
                </div>
                <div className="mt-8 grid grid-cols-3 divide-x divide-white/10 border-y border-white/10 py-5">
                  <div><strong className="block font-display text-2xl font-medium">{completedCount}<span className="text-sm text-white/30">/{totalTasks}</span></strong><span className="mt-1 block font-mono text-[7px] uppercase tracking-widest text-white/30">задач</span></div>
                  <div className="pl-5"><strong className="block font-display text-2xl font-medium text-[#d7ff3f]">{completedCount * 100}</strong><span className="mt-1 block font-mono text-[7px] uppercase tracking-widest text-white/30">XP</span></div>
                  <div className="pl-5"><strong className="block font-display text-2xl font-medium">{planCount}</strong><span className="mt-1 block font-mono text-[7px] uppercase tracking-widest text-white/30">трека в плане</span></div>
                </div>
                <button onClick={onContinue} className="group mt-7 flex w-full items-center justify-between bg-[#d7ff3f] px-5 py-4 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-black transition-colors hover:bg-white">
                  {completedCount ? 'Продолжить работу' : 'Выполнить первую задачу'}<ArrowUpRight size={17} className="transition-transform group-hover:rotate-45" />
                </button>
                <p className="mt-4 text-center font-mono text-[7px] uppercase tracking-wider text-white/25">Без аккаунта · данные не покидают браузер</p>
              </div>
            </Reveal>
          </div>

          <div id="faq" className="mt-28 scroll-mt-28 grid gap-10 lg:grid-cols-12 lg:gap-8">
            <Reveal className="lg:col-span-4">
              <div className="lg:sticky lg:top-28">
                <div className="font-mono text-[9px] uppercase tracking-[0.17em] text-black/40">FAQ</div>
                <h2 className="mt-5 font-display text-5xl font-medium leading-[0.95] tracking-[-0.055em] sm:text-6xl">Перед<br />запуском.</h2>
                <p className="mt-6 max-w-xs text-sm leading-relaxed text-black/45">Ответы на частые вопросы: как начать обучение, где сохраняется прогресс, как работают лаборатории и что делать, если возникли трудности.</p>
              </div>
            </Reveal>
            <div className="border-t border-black/20 lg:col-span-8">
              {faq.map((item, index) => {
                const open = openFaq === index
                return (
                  <div key={item.q} className="border-b border-black/15">
                    <button onClick={() => setOpenFaq(open ? -1 : index)} className="flex w-full items-center justify-between gap-5 py-6 text-left sm:py-7" aria-expanded={open}>
                      <span className="font-display text-xl font-medium tracking-[-0.025em] sm:text-2xl">{item.q}</span>
                      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border border-black/20 transition-all ${open ? 'rotate-180 bg-black text-[#d7ff3f]' : ''}`}><ChevronDown size={16} /></span>
                    </button>
                    <AnimatePresence initial={false}>
                      {open && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} className="overflow-hidden"><p className="max-w-[720px] pb-7 pr-10 text-sm leading-[1.85] text-black/55 sm:text-[15px]">{item.a}</p></motion.div>}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
