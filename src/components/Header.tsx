import { useEffect, useRef, useState } from 'react'
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion'
import { Menu, X } from 'lucide-react'

interface HeaderProps {
  planCount: number
  completedCount: number
  onOpenPlan: () => void
  onStart: () => void
  onOpenCourses: () => void
  mode?: 'home' | 'courses'
  cataloguePlanOnly?: boolean
  onGoHome?: () => void
  onNavigateHomeSection?: (href: string) => void
}

const links = [
  { href: '#learn', label: 'Викторина' },
  { href: '#method', label: 'Метод' },
  { href: '#lab', label: 'Лаборатория' },
  { href: '/courses', label: 'Курсы' },
  { href: '#faq', label: 'FAQ' },
]

// Update 27: TWO states of the SAME header.
// 1) At the hero: a full-width black RECTANGULAR bar, with separated elements.
// 2) Approaching the second section: icon + nav + plan merge into ONE glass pill.
// The "Продолжить" button is deliberately not rendered in either state.
export function Header({ planCount, onOpenPlan, onOpenCourses, mode = 'home', cataloguePlanOnly = false, onGoHome, onNavigateHomeSection }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeLink, setActiveLink] = useState<string | null>(null)
  const planModeRef = useRef(false)
  const targetRef = useRef<string | null>(null)
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1440,
  )
  const [range, setRange] = useState({ start: 180, end: 820 })
  const reduceMotion = useReducedMotion()
  const { scrollY } = useScroll()

  useEffect(() => {
    const measure = () => {
      const width = window.innerWidth
      setViewportWidth(width)
      // Assemble when the next page/section enters view, not as soon as
      // someone moves the wheel a few pixels on the home page.
      const nextSection = document.querySelector(mode === 'courses' ? '#courses-list' : '#learn')
      const sectionTop = nextSection
        ? nextSection.getBoundingClientRect().top + window.scrollY
        : window.innerHeight
      const start = Math.max(60, sectionTop - window.innerHeight * 0.82)
      const end = Math.max(start + 200, sectionTop - window.innerHeight * 0.06)
      setRange({ start, end })
    }

    measure()
    window.addEventListener('resize', measure, { passive: true })
    return () => window.removeEventListener('resize', measure)
  }, [mode])

  useEffect(() => {
    if (!menuOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [menuOpen])

  // Follow the section currently in view, not only the last clicked menu item.
  // The center marker works with the tall sticky Method section as well.
  useEffect(() => {
    let frame = 0
    const updateActive = () => {
      frame = 0
      if (mode === 'courses') {
        setActiveLink(cataloguePlanOnly ? 'plan' : '/courses')
        return
      }
      const marker = window.innerHeight * 0.34
      let visibleSection: string | null = null
      for (const link of links) {
        if (!link.href.startsWith('#')) continue
        const element = document.querySelector(link.href)
        if (element && element.getBoundingClientRect().top <= marker) {
          visibleSection = link.href
        }
      }

      // Keep a clicked destination highlighted while smooth scrolling toward it.
      if (targetRef.current) {
        const destination = document.querySelector(targetRef.current)
        if (destination && destination.getBoundingClientRect().top <= marker + 70) {
          targetRef.current = null
        } else {
          setActiveLink(targetRef.current)
          return
        }
      }

      planModeRef.current = false
      setActiveLink(visibleSection)
    }
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(updateActive)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    updateActive()
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [mode, cataloguePlanOnly])

  const rawProgress = useTransform(scrollY, [range.start, range.end], [0, 1], { clamp: true })
  const springProgress = useSpring(rawProgress, { stiffness: 140, damping: 28, mass: 0.42 })
  const progress = reduceMotion ? rawProgress : springProgress

  // Full viewport width at the top, small floating capsule after scroll.
  // All widths use pixels so the morph interpolates reliably in Framer Motion.
  const narrowViewport = viewportWidth < 1024
  const compactWidth = narrowViewport
    ? Math.max(280, viewportWidth - 24)
    : Math.min(900, viewportWidth - 32)
  const barWidth = useTransform(progress, [0, 1], [viewportWidth, compactWidth])
  const barHeight = useTransform(progress, [0, 1], narrowViewport ? [70, 60] : [76, 66])
  const barTop = useTransform(progress, [0, 1], [0, 12])
  const cornerRadius = useTransform(progress, [0, 1], [0, 999])
  const barBackground = useTransform(progress, [0, 1], [
    'rgba(8, 11, 10, 0.98)',
    'rgba(13, 17, 15, 0.51)',
  ])
  const barBorder = useTransform(progress, [0, 1], [
    'rgba(215, 255, 63, 0.24)',
    'rgba(255, 255, 255, 0.36)',
  ])
  const barShadow = useTransform(progress, [0, 1], [
    '0px 0px 0px rgba(0,0,0,0), inset 0px 1px 0px rgba(255,255,255,0.02), 0px 0px 0px rgba(215,255,63,0)',
    '0px 20px 64px rgba(0,0,0,0.48), inset 0px 1px 0px rgba(255,255,255,0.24), 0px 0px 28px rgba(255,255,255,0.025)',
  ])
  // A restrained glass reflection appears while the bar morphs into a pill.
  const glassShineOpacity = useTransform(progress, [0, 0.45, 1], [0, 0.30, 1])
  const sheenOffset = useTransform(progress, [0, 1], ['-14%', '8%'])

  // At the top: substantial distance between logo, links and plan.
  // After scroll: each of those lives INSIDE the same rounded bar.
  const insidePadding = useTransform(progress, [0, 1], narrowViewport ? [18, 16] : [48, 24])
  const menuGap = useTransform(progress, [0, 1], [25, 4])
  // The inner rounded navigation capsule is only visible after the header assembles.
  const navBackground = useTransform(progress, [0, 1], [
    'rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.055)',
  ])
  const navBorder = useTransform(progress, [0, 1], [
    'rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.14)',
  ])
  const navRadius = useTransform(progress, [0, 1], [0, 999])
  const navPad = useTransform(progress, [0, 1], [0, 5])
  const wordWidth = useTransform(progress, [0, 0.14, 1], [112, 108, 0])
  const wordShift = useTransform(progress, [0, 1], [0, -114])
  const wordOpacity = useTransform(progress, [0, 0.89, 1], [1, 1, 0])
  const wordMargin = useTransform(progress, [0, 1], [10, 0])
  // In the courses catalogue the original Academy PNG is revealed in full at the top.
  // As the navigation compacts, its right portion slides behind the mask;
  // the unscaled S emblem remains visible, preserving the original artwork.
  const academyLogoWidth = useTransform(progress, [0, 0.12, 1],
    narrowViewport ? [210, 210, 43] : [257, 257, 49])

  const navigate = (href: string) => {
    setMenuOpen(false)
    planModeRef.current = false
    targetRef.current = href
    setActiveLink(href)
    if (href === '/courses') {
      targetRef.current = null
      onOpenCourses()
      return
    }
    if (mode === 'courses' && onNavigateHomeSection) {
      targetRef.current = null
      onNavigateHomeSection(href)
      return
    }
    document.querySelector(href)?.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
    })
  }

  const toTop = () => {
    planModeRef.current = false
    targetRef.current = null
    setActiveLink(null)
    if (mode === 'courses' && onGoHome) {
      onGoHome()
      return
    }
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })
  }

  const toPlan = () => {
    setMenuOpen(false)
    planModeRef.current = true
    targetRef.current = null
    setActiveLink('plan')
    onOpenPlan()
  }

  const indicatorTransition = reduceMotion
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 400, damping: 34, mass: 0.75 }

  return (
    <LayoutGroup id="syslab-navigation">
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50" aria-label="Навигация SYS/LAB">
        <motion.div
          className="pointer-events-auto relative isolate mx-auto overflow-visible border backdrop-blur-[28px] backdrop-saturate-[165%] sm:backdrop-blur-[36px]"
          style={{
            width: barWidth,
            height: barHeight,
            marginTop: barTop,
            borderRadius: cornerRadius,
            backgroundColor: barBackground,
            borderColor: barBorder,
            boxShadow: barShadow,
          }}
        >
          {/* Mirror-like, but subtle: reflected light and an internal glass rim. */}
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
            style={{ borderRadius: cornerRadius, opacity: glassShineOpacity }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.12] via-white/[0.025] to-transparent" />
            <motion.div
              className="absolute -top-14 h-32 w-[34%] -skew-x-[26deg] bg-gradient-to-r from-transparent via-white/[0.10] to-transparent blur-xl"
              style={{ left: sheenOffset }}
            />
            <div className="absolute inset-x-[5%] top-px h-px bg-gradient-to-r from-transparent via-white/45 to-transparent" />
            <div className="absolute inset-x-[9%] bottom-px h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </motion.div>
          <motion.div
            className="relative z-10 mx-auto flex h-full w-full max-w-[1500px] items-center justify-between gap-3"
            style={{ paddingLeft: insidePadding, paddingRight: insidePadding }}
          >
            {/* The mark stays sharp and fixed; the word slides left behind it. */}
            <button
              type="button"
              onClick={toTop}
              className="group relative z-10 flex min-w-0 shrink-0 items-center text-left"
              aria-label="SYS/LAB — на главную"
            >
              {mode === 'courses' ? (
                <motion.span
                  className="relative block h-8 shrink-0 overflow-hidden sm:h-10"
                  style={{ width: academyLogoWidth }}
                >
                  <img
                    src={`${import.meta.env.BASE_URL}images/syslab-academy-logo.png"
                    alt="SYS/LAB Academy"
                    draggable={false}
                    className="absolute left-0 top-1/2 h-8 w-auto max-w-none -translate-y-1/2 object-contain sm:h-10"
                  />
                </motion.span>
              ) : (
                <>
                  <img
                    src={`${import.meta.env.BASE_URL}images/syslab-mark.png"
                    alt=""
                    draggable={false}
                    className="relative z-20 h-9 w-auto shrink-0 object-contain sm:h-10"
                  />
                  <motion.span
                    aria-hidden="true"
                    className="relative z-10 block overflow-hidden whitespace-nowrap"
                    style={{ width: wordWidth, marginLeft: wordMargin }}
                  >
                    <motion.span
                      className="block w-max font-display text-[20px] font-extrabold tracking-[-0.05em] text-white sm:text-[23px]"
                      style={{ x: wordShift, opacity: wordOpacity }}
                    >
                      SYS<span className="text-[#d7ff3f]">/</span>LAB
                    </motion.span>
                  </motion.span>
                </>
              )}
            </button>

            {/* An inner rounded glass capsule, with a white pill that glides to
                the currently selected or visible section. */}
            <motion.nav
              className="hidden shrink-0 items-center border lg:flex"
              aria-label="Основные разделы"
              style={{
                gap: menuGap,
                borderRadius: navRadius,
                borderColor: navBorder,
                backgroundColor: navBackground,
                padding: navPad,
              }}
            >
              {links.map((link) => {
                const selected = activeLink === link.href
                return (
                  <button
                    key={link.href}
                    type="button"
                    onClick={() => navigate(link.href)}
                    aria-current={selected ? 'location' : undefined}
                    className="relative isolate whitespace-nowrap rounded-full px-2.5 py-2.5 font-sans text-[11px] font-semibold tracking-normal transition-colors"
                  >
                    {selected && (
                      <motion.span
                        layoutId="syslab-active-white-pill"
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 z-0 rounded-full bg-white shadow-[0_3px_12px_rgba(0,0,0,0.10)]"
                        transition={indicatorTransition}
                      />
                    )}
                    <span className={selected ? 'relative z-10 text-[#101312]' : 'relative z-10 text-white/80 hover:text-white'}>
                      {link.label}
                    </span>
                  </button>
                )
              })}
            </motion.nav>

            {/* My Plan is part of the same navigation. The white selection pill
                moves here as well when the user chooses their personal plan. */}
            <button
              type="button"
              onClick={toPlan}
              aria-current={activeLink === 'plan' ? 'location' : undefined}
              className="relative isolate hidden shrink-0 items-center gap-2 rounded-full bg-transparent px-3 py-2.5 font-sans text-[12px] font-semibold transition-colors lg:flex"
              aria-label={`Мой план: ${planCount} направлений`}
            >
              {activeLink === 'plan' && (
                <motion.span
                  layoutId="syslab-active-white-pill"
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 z-0 rounded-full bg-white shadow-[0_3px_12px_rgba(0,0,0,0.10)]"
                  transition={indicatorTransition}
                />
              )}
              <span className={activeLink === 'plan' ? 'relative z-10 text-[#101312]' : 'relative z-10 text-white/80 hover:text-white'}>
                Мой план
              </span>
              <span className={`relative z-10 ${activeLink === 'plan' ? 'text-[#517000]' : 'text-[#d7ff3f]'}`}>
                {planCount}
              </span>
            </button>

            {/* Mobile gets the same bar morph, with the links in a menu. */}
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="ml-auto grid h-10 w-10 shrink-0 place-items-center rounded-full text-white lg:hidden"
              aria-label="Открыть меню"
              aria-expanded={menuOpen}
            >
              <Menu size={21} />
            </button>
          </motion.div>
        </motion.div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed inset-0 z-[80] bg-[#0a0c0b]/95 text-white backdrop-blur-2xl lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Мобильная навигация SYS/LAB"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: reduceMotion ? 0.08 : 0.3 }}
          >
            <div className="flex h-[80px] items-center justify-between border-b border-white/10 px-5 sm:px-8">
              <div className="flex items-center gap-3">
                {mode === 'courses' ? (
                  <img src={`${import.meta.env.BASE_URL}images/syslab-academy-logo.png" alt="SYS/LAB Academy" draggable={false} className="h-8 w-auto max-w-[min(70vw,280px)] object-contain sm:h-10" />
                ) : (
                  <>
                    <img src={`${import.meta.env.BASE_URL}images/syslab-mark.png" alt="" draggable={false} className="h-10 w-auto object-contain" />
                    <span className="font-display text-[22px] font-extrabold tracking-[-0.05em]">
                      SYS<span className="text-[#d7ff3f]">/</span>LAB
                    </span>
                  </>
                )}
              </div>
              <button type="button" onClick={() => setMenuOpen(false)} aria-label="Закрыть меню" className="grid h-10 w-10 place-items-center">
                <X size={22} />
              </button>
            </div>
            <nav className="flex flex-col px-6 pt-8 sm:px-8" aria-label="Меню разделов">
              {links.map((link, index) => (
                <motion.button
                  key={link.href}
                  type="button"
                  onClick={() => navigate(link.href)}
                  className="flex items-center justify-between border-b border-white/10 py-5 text-left font-display text-[clamp(1.6rem,7vw,2.5rem)] font-medium tracking-[-0.04em]"
                  initial={reduceMotion ? false : { opacity: 0, x: -18 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: reduceMotion ? 0 : 0.08 + index * 0.045 }}
                >
                  {link.label}
                  <span className="font-sans text-xs text-[#d7ff3f]">0{index + 1}</span>
                </motion.button>
              ))}
              <button type="button" onClick={toPlan} className="flex items-center justify-between py-5 text-left font-display text-xl font-medium">
                Мой план <span className="text-[#d7ff3f]">{planCount}</span>
              </button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </LayoutGroup>
  )
}
