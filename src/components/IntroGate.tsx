import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Volume2 } from 'lucide-react'

// The original MP4 files are copied verbatim into public/videos (no transcoding).
const INTRO_VIDEOS = [
  `${import.meta.env.BASE_URL}videos/syslab-intro-01.mp4`,
  `${import.meta.env.BASE_URL}videos/syslab-intro-02.mp4`,
  `${import.meta.env.BASE_URL}videos/syslab-intro-03.mp4`,
] as const

const SEEN_IN_TAB_KEY = 'syslab-intro-seen-in-tab-v1'
const LAST_VIDEO_KEY = 'syslab-intro-last-video-v1'

function needsIntro(): boolean {
  if (typeof window === 'undefined') return false
  try {
    // A new tab/session gets an intro. Reloading or navigating in this tab does not.
    return window.sessionStorage.getItem(SEEN_IN_TAB_KEY) !== '1'
  } catch {
    return true
  }
}

function chooseIntro(): number {
  let previous = -1
  try {
    previous = Number(window.localStorage.getItem(LAST_VIDEO_KEY) ?? -1)
  } catch {
    // Storage may be disabled; random playback still works.
  }

  // Random among the two other videos, to avoid the same intro twice in a row.
  const options = [0, 1, 2].filter((index) => index !== previous)
  return options[Math.floor(Math.random() * options.length)]
}

interface IntroGateProps {
  children: ReactNode
}

export function IntroGate({ children }: IntroGateProps) {
  const [showIntro, setShowIntro] = useState(needsIntro)
  const [showSite, setShowSite] = useState(() => !needsIntro())
  const [videoIndex] = useState(chooseIntro)
  const [exiting, setExiting] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [audioState, setAudioState] = useState<'loading' | 'on' | 'muted' | 'blocked'>('loading')
  const reduceMotion = useReducedMotion()
  const videoRef = useRef<HTMLVideoElement>(null)
  const endingRef = useRef(false)
  const finishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const exitDurationMs = reduceMotion ? 150 : 600

  const finishIntro = useCallback(() => {
    if (endingRef.current) return
    endingRef.current = true
    // Mount the existing site after the intro finishes. This lets
    // its Hero/Header entrance animations play when the user actually sees them.
    setShowSite(true)
    setExiting(true)
    finishTimerRef.current = setTimeout(() => setShowIntro(false), exitDurationMs)
  }, [exitDurationMs])

  useEffect(() => {
    if (!showIntro) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    try {
      window.sessionStorage.setItem(SEEN_IN_TAB_KEY, '1')
      window.localStorage.setItem(LAST_VIDEO_KEY, String(videoIndex))
    } catch {
      // Storage blocked: keep the intro functional anyway.
    }

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [showIntro, videoIndex])

  useEffect(() => {
    if (!showIntro) return
    const video = videoRef.current
    if (!video) return
    let cancelled = false

    // Prefer playing the ORIGINAL audio track, without changing any MP4 files.
    // Most browsers block audible autoplay; fall back to muted autoplay and
    // offer an explicit, one-click way to enable the soundtrack.
    video.muted = false
    video.volume = 1

    const tryMutedAutoplay = () => {
      if (cancelled || endingRef.current) return
      video.muted = true
      try {
        const request = video.play()
        void request.then(() => {
          if (!cancelled) setAudioState('muted')
        }).catch(() => {
          if (!cancelled) setAudioState('blocked')
        })
      } catch {
        if (!cancelled) setAudioState('blocked')
      }
    }

    try {
      const request = video.play()
      void request.then(() => {
        if (!cancelled) setAudioState('on')
      }).catch((error: unknown) => {
        if (cancelled) return
        if (error instanceof DOMException && error.name === 'AbortError') return
        tryMutedAutoplay()
      })
    } catch {
      tryMutedAutoplay()
    }

    // A network failure must never leave the visitor trapped on the intro.
    fallbackTimerRef.current = setTimeout(() => {
      if (!video.ended && video.paused) finishIntro()
    }, 25000)

    return () => {
      cancelled = true
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current)
      if (finishTimerRef.current) clearTimeout(finishTimerRef.current)
    }
  }, [showIntro, finishIntro])

  const enableAudio = () => {
    const video = videoRef.current
    if (!video || endingRef.current) return

    // Must happen directly in response to a real click/tap.
    video.muted = false
    video.volume = 1
    try {
      const request = video.play()
      void request.then(() => setAudioState('on')).catch(() => {
        video.muted = true
        setAudioState('muted')
        void video.play().catch(() => setAudioState('blocked'))
      })
    } catch {
      video.muted = true
      setAudioState('muted')
    }
  }

  return (
    <>
      {showSite && children}
      {showIntro && (
        <motion.div
          className="fixed inset-0 z-[999] overflow-hidden bg-[#000]"
          initial={false}
          animate={{ opacity: exiting ? 0 : 1 }}
          transition={{ duration: exitDurationMs / 1000, ease: [0.16, 1, 0.3, 1] }}
          style={{ pointerEvents: exiting ? 'none' : 'auto' }}
          onClick={finishIntro}
          role="dialog"
          aria-modal="true"
          aria-label="Видео-заставка SYS/LAB"
        >
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover object-center"
            src={INTRO_VIDEOS[videoIndex]}
            playsInline
            preload="auto"
            controls={false}
            disablePictureInPicture
            disableRemotePlayback
            onPlaying={() => {
              setPlaying(true)
              if (videoRef.current?.muted) setAudioState('muted')
              else setAudioState('on')
            }}
            onEnded={finishIntro}
            onError={finishIntro}
            aria-label="Анимация логотипа SYS/LAB"
          />

          {!playing && !exiting && (
            <span className="pointer-events-none absolute bottom-7 left-6 font-mono text-[10px] uppercase tracking-[0.22em] text-white/45 sm:left-10">
              SYS/LAB — Загрузка заставки
            </span>
          )}

          <AnimatePresence>
            {(audioState === 'muted' || audioState === 'blocked') && !exiting && (
              <motion.div
                key="audio-cta"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: reduceMotion ? 0.1 : 0.4, ease: 'easeOut' }}
                className="pointer-events-none absolute z-10 px-4"
                style={{ top: 'max(18px, env(safe-area-inset-top))', left: 'max(18px, env(safe-area-inset-left))' }}
              >
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    enableAudio()
                  }}
                  className="pointer-events-auto group relative flex min-h-[48px] items-center gap-2.5 rounded-full border border-white/14 bg-white/[0.08] px-3.5 py-2.5 text-left shadow-[0_10px_32px_rgba(0,0,0,0.34)] ring-1 ring-white/6 backdrop-blur-[18px] transition-[border-color,background-color,transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:border-white/22 hover:bg-white/[0.12] hover:shadow-[0_14px_40px_rgba(0,0,0,0.42)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d7ff3f] sm:gap-3 sm:px-4"
                  aria-label={audioState === 'blocked' ? 'Запустить видеозаставку со звуком' : 'Включить звук видеозаставки'}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/12 bg-black/15 text-[#d7ff3f] transition-colors group-hover:bg-black/20">
                    <Volume2 size={15} strokeWidth={1.8} aria-hidden="true" />
                  </span>
                  <span
                    className="flex min-w-0 flex-col gap-0 pr-1.5"
                    style={{ fontFamily: '"Manrope", "Inter Tight", "Segoe UI", sans-serif' }}
                  >
                    <span className="text-[9px] font-medium tracking-[-0.01em] text-white/60 sm:text-[10px]">SYS/LAB · Sound</span>
                    <span className="whitespace-nowrap text-[13px] font-medium leading-[1.25] tracking-[-0.03em] text-white sm:text-[14px]">
                      {audioState === 'blocked' ? 'Запустить со звуком' : 'Включить звук'}
                    </span>
                  </span>
                  <span className="ml-1 flex h-6 items-center gap-[3px] border-l border-white/12 pl-3" aria-hidden="true">
                    {[9, 17, 12, 20, 10].map((peak, index) => (
                      <motion.span
                        key={index}
                        className="w-[2px] rounded-full bg-[#d7ff3f] shadow-[0_0_8px_rgba(215,255,63,0.45)]"
                        initial={{ height: 5 }}
                        animate={reduceMotion ? { height: peak * 0.7 } : { height: [5, peak, 5] }}
                        transition={reduceMotion ? { duration: 0 } : { repeat: Infinity, duration: 1 + index * 0.1, delay: index * 0.12, ease: 'easeInOut' }}
                      />
                    ))}
                  </span>
                  <span className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-b from-white/[0.10] via-transparent to-transparent opacity-80" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </>
  )
}
