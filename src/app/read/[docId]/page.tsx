'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { FocusHUD } from '@/components/reader/FocusHUD'
import { RecallSlate } from '@/components/reader/RecallSlate'
import { api } from '@/lib/api'
import { useReadingGovernor } from '@/hooks/useReadingGovernor'

interface Sector {
  sector_id: string
  text: string
  sector_index: number
  chapter_title: string | null
  prev_sector: string | null
  next_sector: string | null
  status: string
  word_count?: number | null
}

interface DocStructure {
  sectors: Array<{ id: string; status: string }>
}

export default function ReaderPage() {
  return <ProtectedRoute><Reader /></ProtectedRoute>
}

function Reader() {
  const { docId } = useParams<{ docId: string }>()
  const [sector, setSector] = useState<Sector | null>(null)
  const [docStructure, setDocStructure] = useState<DocStructure | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const endRef = useRef<HTMLDivElement>(null)

  const wordCount = sector
    ? sector.word_count || sector.text.split(/\s+/).filter(Boolean).length
    : 0
  const governor = useReadingGovernor({
    sectorKey: sector?.sector_id ?? null,
    wordCount,
    contentRef,
    endRef,
  })

  const loadSector = useCallback(async (sectorId: string) => {
    try {
      const s: Sector = await api.get(`/sectors/${sectorId}`)
      setSector(s)
      window.scrollTo(0, 0)
    } catch (e) {
      console.error('Failed to load sector:', e)
    }
  }, [])

  useEffect(() => {
    api.get(`/documents/${docId}/structure`).then((data: DocStructure) => {
      setDocStructure(data)
      const firstActive = data.sectors?.find(s => s.status === 'active')
      if (firstActive) loadSector(firstActive.id)
    }).catch(console.error)
  }, [docId, loadSector])

  // A synthesis just passed: count it in the HUD right away, then re-sync with the
  // server (which also unlocks the next sector).
  const markMastered = useCallback((sectorId: string) => {
    setDocStructure(prev => prev && {
      ...prev,
      sectors: prev.sectors.map(s => s.id === sectorId ? { ...s, status: 'mastered' } : s),
    })
    api.get(`/documents/${docId}/structure`).then(setDocStructure).catch(console.error)
  }, [docId])

  // Keyboard navigation: ← prev sector, → next sector
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && sector?.next_sector) loadSector(sector.next_sector)
      if (e.key === 'ArrowLeft' && sector?.prev_sector) loadSector(sector.prev_sector)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [sector, loadSector])

  const masteredCount = docStructure?.sectors?.filter(s => s.status === 'mastered').length ?? 0
  const totalSectors = docStructure?.sectors?.length ?? 0

  if (!sector) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        Loading...
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <FocusHUD
        docId={docId}
        chapterTitle={sector.chapter_title ?? 'Reading'}
        sectorIndex={sector.sector_index}
        totalSectors={totalSectors}
        masteredCount={masteredCount}
      />
      {governor.skimWarning && (
        <div
          role="status"
          className="fixed top-16 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-lg bg-amber-950 border border-amber-500/60 text-amber-200 text-sm shadow-lg"
        >
          You&apos;re skimming. Slow down so it sticks.
        </div>
      )}
      <div className="max-w-3xl mx-auto pt-20 pb-20 px-6">
        <div ref={contentRef} className="space-y-4">
          {sector.text.split('\n\n').map((paragraph, i) => (
            <p key={i} className="text-gray-200 leading-relaxed text-lg">
              {paragraph}
            </p>
          ))}
        </div>
        <div ref={endRef} aria-hidden className="h-px" />
        <RecallSlate
          key={sector.sector_id}
          sectorId={sector.sector_id}
          velocityLocked={!governor.unlocked}
          lockMessage={governor.lockMessage}
          onPassed={() => markMastered(sector.sector_id)}
          onMastered={(nextId, bossFight) => {
            if (nextId) loadSector(nextId)
            // Boss fight modal wired in Task 18
          }}
        />
      </div>
    </main>
  )
}
