import { useEffect } from 'react'
import { motion } from 'framer-motion'

type Phase = 'idle' | 'cover' | 'video' | 'reveal'

type Props = {
  phase: Phase
  onCovered: () => void
  onVideoEnded: () => void
  onRevealed: () => void
}

const LOGO_HOLD_MS = 1600

/**
 * Match the supplied SYS/LAB 1920x1080 artwork:
 * subtle dark grid, compact centered white S mark with lime accents.
 * The complete design is stationary while the wipe reveals it from right to left.
 * After a 1.6-second hold, the wipe clears towards the left.
 *
 * The legacy 'video' phase and callback names are kept for App.tsx.
 */
export function CoursesTransition({ phase, onCovered, onVideoEnded, onRevealed }: Props) {
  const revealed = phase === 'reveal'

  useEffect(() => {
    if (phase !== 'video') return
    const timeout = window.setTimeout(onVideoEnded, LOGO_HOLD_MS)
    return () => window.clearTimeout(timeout)
  }, [phase, onVideoEnded])

  if (phase === 'idle') return null

  return (
    <motion.div
      role="presentation"
      aria-hidden="true"
      className="fixed inset-0 z-[1000] overflow-hidden"
      style={{
        willChange: 'clip-path',
        backgroundColor: '#020303',
        backgroundImage:
          'linear-gradient(to right, rgba(255,255,255,0.085) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.085) 1px, transparent 1px)',
        backgroundSize: '80px 80px',
        backgroundPosition: 'center center',
      }}
      initial={{ clipPath: 'inset(0 0% 0 100%)' }}
      animate={{ clipPath: revealed ? 'inset(0 100% 0 0%)' : 'inset(0 0% 0 0%)' }}
      transition={{
        duration: 0.8,
        ease: [0.76, 0, 0.24, 1],
      }}
      onAnimationComplete={() => {
        if (phase === 'cover') onCovered()
        if (phase === 'reveal') onRevealed()
      }}
    >
      <img
        src={`${import.meta.env.BASE_URL}images/syslab-mark.png`}
        alt=""
        draggable={false}
        loading="eager"
        decoding="sync"
        className="pointer-events-none absolute left-1/2 top-1/2 h-auto w-[clamp(92px,8vw,150px)] max-w-[70vw] max-h-[55vh] -translate-x-1/2 -translate-y-1/2 select-none object-contain"
      />
    </motion.div>
  )
}
