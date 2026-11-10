import { useRef, useState } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'

interface HeroProps {
  onStart: () => void
}

const skills = ['LINUX', 'TCP / IP', 'WINDOWS SERVER', 'VIRTUALIZATION', 'ACTIVE DIRECTORY', 'SYSTEMD', 'NETWORKING', 'INFRASTRUCTURE']

const ease = [0.16, 1, 0.3, 1] as const

export function Hero({ onStart }: HeroProps) {
  const ref = useRef<HTMLElement>(null)
  const [videoFailed, setVideoFailed] = useState(false)
  const [videoReady, setVideoReady] = useState(false)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const imageY = useTransform(scrollYProgress, [0, 1], [0, 140])
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -65])
  const visualScale = useTransform(scrollYProgress, [0, 1], [1, 1.09])
  const fade = useTransform(scrollYProgress, [0, 0.85], [1, 0])

  return (
    <section ref={ref} className="hero-grid relative min-h-[100svh] overflow-hidden border-b border-white/10 bg-[#0a0c0b]">
      {/* Video lives behind all content, while the intro (IntroGate) stays separate. */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={reduced ? undefined : { y: imageY, scale: visualScale, opacity: fade }}
      >
        {!reduced && !videoFailed && (
          <video
            className={`absolute inset-0 h-full w-full object-cover object-right transition-opacity duration-500 ease-out ${videoReady ? 'opacity-90' : 'opacity-0'}`}
            src={`${import.meta.env.BASE_URL}videos/syslab-hero-background.mp4`}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            controls={false}
            disablePictureInPicture
            disableRemotePlayback
            onPlaying={() => setVideoReady(true)}
            onError={() => setVideoFailed(true)}
            aria-hidden="true"
            tabIndex={-1}
          />
        )}
        {/* Dark gradient preserves legibility of the existing white headline. */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0c0b]/95 via-[#0a0c0b]/50 to-[#0a0c0b]/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c0b]/70 via-transparent to-[#0a0c0b]/35" />
      </motion.div>

      <div className="pointer-events-none absolute inset-0 opacity-40 hero-scan" />
      <motion.div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-none flex-col px-5 pb-[94px] pt-[112px] sm:px-8 lg:px-[4vw] lg:pb-[98px] lg:pt-[104px]" style={reduced ? undefined : { y: contentY }}>
        <div className="grid flex-1 grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,60%)_minmax(0,40%)] lg:gap-0">
          <div className="relative z-20 min-w-0 xl:-translate-y-3">
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.65 }} className="mb-7 flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.16em] text-white/65 sm:text-[11px] xl:mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-[#d7ff3f] shadow-[0_0_14px_#d7ff3f]" />
              IT education / hands-on infrastructure
              <span className="hidden h-px w-12 bg-white/20 sm:block" />
              <span className="hidden text-[#d7ff3f] sm:inline">2026</span>
            </motion.div>

            <h1 className="w-full font-display text-[clamp(3.6rem,8.6vw,9rem)] font-semibold leading-[0.79] tracking-[-0.075em] text-[#f1f2ec] xl:w-[calc(100vw-8vw)] xl:font-['Inter'] xl:text-[clamp(128px,8.9vw,165px)] xl:font-bold xl:leading-[0.74] xl:tracking-[-0.072em]">
              {['FEEL THE', 'POWER OVER', 'THE SYSTEM'].map((line, index) => (
                <span key={line} className="block overflow-hidden pb-[0.09em] xl:pb-[0.075em]">
                  <motion.span
                    className={`block origin-left ${index === 2 ? 'text-[#d7ff3f]' : ''}`}
                    initial={reduced ? false : { y: '115%', rotate: 2 }}
                    animate={{ y: '0%', rotate: 0 }}
                    transition={{ duration: 1.05, delay: 0.18 + index * 0.11, ease }}
                  >
                    {line}
                  </motion.span>
                </span>
              ))}
            </h1>

            <div className="mt-7 grid max-w-[900px] gap-7 sm:grid-cols-[1fr_auto] sm:items-end xl:mt-6 xl:grid-cols-[minmax(0,485px)_auto] xl:items-start xl:gap-12">
              <motion.p initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.72, duration: 0.8, ease }} className="max-w-[510px] text-[15px] leading-relaxed text-white/70 sm:text-base xl:leading-[1.5]">
                Системное администрирование через действие. Настраивайте Linux, восстанавливайте сети и поднимайте сервисы — прямо в браузере.
              </motion.p>
              <motion.button onClick={onStart} initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.85, duration: 0.65, ease }} className="group flex h-[58px] w-fit items-center gap-8 bg-[#d7ff3f] pl-6 pr-4 syslab-meta font-bold uppercase text-black transition-all hover:bg-white hover:shadow-[0_0_45px_rgba(215,255,63,0.16)] sm:justify-self-end xl:h-[66px] xl:min-w-[254px] xl:justify-between xl:pl-7 xl:pr-3">
                Запустить lab
                <span className="grid h-9 w-9 place-items-center bg-black text-[#d7ff3f] transition-transform group-hover:rotate-45 xl:h-11 xl:w-11"><ArrowUpRight size={18} /></span>
              </motion.button>
            </div>
          </div>


        </div>

      </motion.div>
      {/* The continuously moving tech strip is now part of the first screen. */}
      <div className="absolute inset-x-0 bottom-0 z-20 flex h-[65px] items-center overflow-hidden border-t border-white/10 bg-[#101312]" aria-hidden="true">
        <div className="skill-marquee flex w-max items-center">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 items-center">
              {[...skills, ...skills, ...skills].map((skill, index) => (
                <div key={`${copy}-${index}`} className="flex shrink-0 items-center syslab-meta-small uppercase text-white/85">
                  <span className="px-7">{skill}</span>
                  <span className="h-1 w-1 shrink-0 rotate-45 bg-[#d7ff3f]/60" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
