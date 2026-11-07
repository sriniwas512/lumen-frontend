import { RefObject, useEffect, useRef, useState } from 'react'

// Velocity Governor: makes sure a sector is actually read before synthesis unlocks.
//  - minimum time scales with sector length (never less than MIN_SECONDS)
//  - the reader must reach the end of the text
//  - scrolling further than could have been read shows a warning
const FAST_READ_WPM = 600   // minimum time = the sector read at a brisk 600 words/minute
const MIN_SECONDS = 30
const SKIM_WPM = 900        // ~3.5x a typical 250 wpm reading pace
const GRACE_SCREENS = 0.5   // may scroll this far ahead of what's been read without a warning
const WARNING_MS = 4000

export function minimumSeconds(wordCount: number) {
  return Math.max(MIN_SECONDS, Math.ceil((wordCount / FAST_READ_WPM) * 60))
}

interface Options {
  sectorKey: string | null
  wordCount: number
  contentRef: RefObject<HTMLElement | null>
  endRef: RefObject<HTMLElement | null>
}

export function useReadingGovernor({ sectorKey, wordCount, contentRef, endRef }: Options) {
  const required = minimumSeconds(wordCount)
  const [secondsLeft, setSecondsLeft] = useState(required)
  const [reachedEnd, setReachedEnd] = useState(false)
  const [skimWarning, setSkimWarning] = useState(false)
  const [skimCount, setSkimCount] = useState(0)
  const wordCountRef = useRef(wordCount)
  wordCountRef.current = wordCount

  // Countdown: restarts for each sector, and the old timer is always cleared.
  useEffect(() => {
    if (!sectorKey) return
    const startedAt = Date.now()
    setSecondsLeft(required)
    const timer = setInterval(() => {
      const left = Math.max(0, required - Math.floor((Date.now() - startedAt) / 1000))
      setSecondsLeft(left)
      if (left === 0) clearInterval(timer)
    }, 1000)
    return () => clearInterval(timer)
  }, [sectorKey, required])

  // Reached the end of the text?
  useEffect(() => {
    setReachedEnd(false)
    const el = endRef.current
    if (!sectorKey || !el) return
    const observer = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) {
        setReachedEnd(true)
        observer.disconnect()
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [sectorKey, endRef])

  // Skim detection. Reading happens in bursts (read a screen, then scroll), so scroll
  // *speed* is misleading. Instead compare how many words have scrolled past the top of
  // the screen with how many could have been read since the sector opened.
  useEffect(() => {
    setSkimWarning(false)
    setSkimCount(0)
    if (!sectorKey) return
    const openedAt = performance.now()
    let lastWarnedAtWords = -Infinity
    let hideTimer: ReturnType<typeof setTimeout> | undefined

    const onScroll = () => {
      const content = contentRef.current
      const words = wordCountRef.current
      if (!content || words <= 0) return
      const rect = content.getBoundingClientRect()
      const pixelsPerWord = rect.height / words
      const wordsPassed = Math.max(0, -rect.top) / pixelsPerWord
      const graceWords = (window.innerHeight * GRACE_SCREENS) / pixelsPerWord
      const readable = ((performance.now() - openedAt) / 60_000) * SKIM_WPM

      // Warn once per further half-screen of skimming, not on every scroll event.
      if (wordsPassed > readable + graceWords && wordsPassed - lastWarnedAtWords > graceWords) {
        lastWarnedAtWords = wordsPassed
        setSkimCount(c => c + 1)
        setSkimWarning(true)
        clearTimeout(hideTimer)
        hideTimer = setTimeout(() => setSkimWarning(false), WARNING_MS)
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      clearTimeout(hideTimer)
    }
  }, [sectorKey, contentRef])

  const unlocked = secondsLeft === 0 && reachedEnd
  const lockMessage = !reachedEnd
    ? 'Read to the end of the sector to unlock synthesis...'
    : secondsLeft > 0
      ? `Synthesis unlocks in ${secondsLeft}s. Take your time with the text...`
      : null

  return { unlocked, secondsLeft, reachedEnd, skimWarning, skimCount, lockMessage }
}
