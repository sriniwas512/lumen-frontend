'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { FocusHUD } from '@/components/reader/FocusHUD'
import { RecallSlate } from '@/components/reader/RecallSlate'
import { api } from '@/lib/api'

interface Sector {
  sector_id: string
  text: string
  sector_index: number
  chapter_title: string | null
  prev_sector: string | null
  next_sector: string | null
  status: string
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
  const [velocityLocked, setVelocityLocked] = useState(true)

  const loadSector = useCallback(async (sectorId: string) => {
    try {
      const s: Sector = await api.get(`/sectors/${sectorId}`)
      setSector(s)
      setVelocityLocked(true)
      // Velocity Governor: 30s minimum reading time before recall slate activates
      setTimeout(() => setVelocityLocked(false), 30_000)
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
        chapterTitle={sector.chapter_title ?? 'Reading'}
        sectorIndex={sector.sector_index}
        totalSectors={totalSectors}
        masteredCount={masteredCount}
      />
      <div className="max-w-3xl mx-auto pt-20 pb-20 px-6">
        <div className="space-y-4">
          {sector.text.split('\n\n').map((paragraph, i) => (
            <p key={i} className="text-gray-200 leading-relaxed text-lg">
              {paragraph}
            </p>
          ))}
        </div>
        <RecallSlate
          sectorId={sector.sector_id}
          velocityLocked={velocityLocked}
          onMastered={(nextId, bossFight) => {
            if (nextId) loadSector(nextId)
            // Boss fight modal wired in Task 18
          }}
        />
      </div>
    </main>
  )
}
