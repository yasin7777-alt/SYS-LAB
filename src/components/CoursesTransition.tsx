import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

type Phase = 'idle' | 'cover' | 'video' | 'reveal'

type Props = {
  phase: Phase
  onCovered: () => void
  onVideoEnded: () => void
  onRevealed: () => void
}

const CURTAIN_COLOR = '#151717'

/**
 * Strict sequence:
 * cover: opaque dark curtain slides in from the RIGHT (right-to-left wipe).
 * video: curtain has fully covered the screen, then and only then video plays.
 * reveal: the same curtain slides out to the RIGHT, exposing the new page
 * from left to right.
 *
 * IMPORTANT: keep this component as a stable sibling of route content in App;
 * do not render separate instances inside the home and catalogue branches.
 */
export function CoursesTransition({ phase, onCovered, onVideoEnded, onRevealed }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const revealed = phase === 'reveal'

  useEffect(() => {
    if (phase !== 'video') return
    const video = videoRef.current
    if (!video) return

    // Force playback only AFTER the curtain's covering animation finishes.
    // Muted to satisfy autoplay restrictions, preserving the original MP4.
    video.currentTime = 0
    video.muted = true
    const playback = video.play()
    playback?.catch(() => onVideoEnded())

    // Safety net if media fails to send onEnded; never trap the visitor.
    const timeout = window.setTimeout(onVideoEnded, 9000)
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
      {/* Do not render ANY logo/video during the cover: the curtain is
          pure charcoal so the old page is completely hidden before playback. */}
      {phase === 'video' && (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          src={`${import.meta.env.BASE_URL}videos/syslab-courses-transition.mp4"
          muted
          playsInline
          preload="auto"
          onEnded={onVideoEnded}
          onError={onVideoEnded}
          aria-hidden="true"
        />
      )}
    </motion.div>
  )
}
