'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { api } from '@/lib/api'
import { ProfileMenu } from '@/components/ProfileMenu'

interface Attempt {
  content: string
  score: number | null
  feedback: string | null
  hint: string | null
  attempt_number: number | null
  created_at: string
}

interface SectorNotes {
  sector_id: string
  sector_index: number
  chapter_title: string | null
  attempts: Attempt[]
}

interface NotesResponse {
  title: string
  notes: SectorNotes[]
}

const PASS_MARK = 6

export default function NotesPage() {
  return <ProtectedRoute><Notes /></ProtectedRoute>
}

function Notes() {
  const { docId } = useParams<{ docId: string }>()
  const [data, setData] = useState<NotesResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    api.get(`/documents/${docId}/notes`)
      .then(setData)
      .catch(() => setError("Couldn't load your notes. Please try again."))
  }, [docId])

  const writtenCount = data?.notes.reduce((n, s) => n + s.attempts.length, 0) ?? 0

  return (
    <main className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-10 bg-black/90 backdrop-blur border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <Link href="/library" className="text-sm text-gray-400 hover:text-white">← Library</Link>
        <div className="flex items-center gap-4">
          <Link href={`/read/${docId}`} className="text-sm text-blue-400 hover:text-blue-300">Continue reading →</Link>
          <ProfileMenu />
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <p className="text-gray-500 text-sm">My notes</p>
        <h1 className="text-3xl font-bold mt-1">{data?.title ?? (error ? 'Notes' : 'Loading...')}</h1>

        {error && <p className="mt-6 text-red-400 text-sm">{error}</p>}

        {data && data.notes.length === 0 && (
          <p className="mt-8 text-gray-500">
            Nothing here yet. Every synthesis you submit while reading this book will appear here.
          </p>
        )}

        {data && data.notes.length > 0 && (
          <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
            <span>{data.notes.length} sectors · {writtenCount} syntheses</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={showAll} onChange={e => setShowAll(e.target.checked)} />
              Show failed attempts too
            </label>
          </div>
        )}

        <div className="mt-8 space-y-8">
          {data?.notes.map(sector => {
            const best = sector.attempts.reduce<Attempt | null>(
              (b, a) => (b === null || (a.score ?? 0) >= (b.score ?? 0) ? a : b), null)
            const shown = showAll ? sector.attempts : best ? [best] : []
            return (
              <section key={sector.sector_id}>
                <h2 className="text-sm text-gray-400">
                  Sector {sector.sector_index + 1}
                  {sector.chapter_title && <span className="text-gray-600"> · {sector.chapter_title}</span>}
                </h2>
                <div className="mt-3 space-y-3">
                  {shown.map((a, i) => (
                    <article key={i} className="border border-gray-800 rounded-xl p-5 bg-gray-950">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                        <span>
                          {new Date(a.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                          {sector.attempts.length > 1 && a.attempt_number ? ` · attempt ${a.attempt_number}` : ''}
                        </span>
                        {a.score !== null && (
                          <span className={a.score >= PASS_MARK ? 'text-green-400' : 'text-yellow-400'}>
                            {a.score} / 10
                          </span>
                        )}
                      </div>
                      <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">{a.content}</p>
                      {a.feedback && (
                        <details className="mt-3 text-sm text-gray-400">
                          <summary className="cursor-pointer text-gray-500 hover:text-gray-300">Grader feedback</summary>
                          <p className="mt-2">{a.feedback}</p>
                        </details>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </main>
  )
}
