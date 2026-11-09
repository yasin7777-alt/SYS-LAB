import { useEffect } from 'react'
import { motion } from 'framer-motion'

type Phase = 'idle' | 'cover' | 'video' | 'reveal'

type Props = {
  phase: Phase
  onCovered: () => void
  onVideoEnded: () => void
  onRevealed: () => void
}

const CURTAIN_COLOR = '#151717'
const LOGO_HOLD_MS = 1500

/**
 * Preserve the original curtain animation:
 * 1. An opaque curtain slides in from the right and covers the home page.
 * 2. A centered SYS/LAB brand mark (no text or video) replaces the old MP4.
 * 3. The curtain slides right and reveals the courses page.
 *
 * Keep this component as a stable sibling of route content in App.
 * The legacy 'video' phase and callback name are retained for compatibility.
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
      style={{ background: CURTAIN_COLOR, willChange: 'transform' }}
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
      {/* No logo appears until the curtain has fully covered the previous page. */}
      {(phase === 'video' || phase === 'reveal') && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center px-6"
          initial={false}
          animate={{ opacity: revealed ? 0 : 1 }}
          transition={{ duration: 0.25 }}
        >
          <img
            src={`${import.meta.env.BASE_URL}images/syslab-mark.png`}
            alt=""
            draggable={false}
            className="h-auto w-[min(40vw,180px)] max-h-[40vh] object-contain"
          />
        </motion.div>
      )}
    </motion.div>
  )
}
