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
 * The logo and the black backdrop move as ONE curtain.
 * Show the logo immediately, including during the cover phase:
 * there must never be a separate black-only screen before it appears.
 *
 * Keep the legacy video phase/callback names for App compatibility.
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
      className="fixed inset-0 z-[1000] overflow-hidden bg-black"
      style={{ willChange: 'transform' }}
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
        className="pointer-events-none absolute left-1/2 top-1/2 h-auto w-[clamp(150px,21vw,410px)] max-w-[72vw] max-h-[56vh] -translate-x-1/2 -translate-y-1/2 select-none object-contain"
      />
    </motion.div>
  )
}
