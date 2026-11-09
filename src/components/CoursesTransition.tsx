import { useEffect } from 'react'
import { motion } from 'framer-motion'

type Phase = 'idle' | 'cover' | 'video' | 'reveal'

type Props = {
  phase: Phase
  onCovered: () => void
  onVideoEnded: () => void
  onRevealed: () => void
}

const LOGO_HOLD_MS = 1500

/**
 * Match the supplied SYS/LAB 1920x1080 artwork:
 * subtle dark grid, centered white S mark with lime accents.
 * The complete composition moves with the curtain from its first frame.
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
        willChange: 'transform',
        backgroundColor: '#020303',
        backgroundImage:
          'linear-gradient(to right, rgba(255,255,255,0.085) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.085) 1px, transparent 1px)',
        backgroundSize: '80px 80px',
        backgroundPosition: 'center center',
      }}
      initial={{ x: '100%' }}
      animate={{ x: revealed ? '100%' : '0%' }}
      transition={{
        duration: revealed ? 0.70 : 0.72,
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
        className="pointer-events-none absolute left-1/2 top-1/2 h-auto w-[clamp(190px,25vw,400px)] max-w-[70vw] max-h-[55vh] -translate-x-1/2 -translate-y-1/2 select-none object-contain"
      />
    </motion.div>
  )
}
