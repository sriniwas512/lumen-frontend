'use client'
import { useCallback, useEffect, useState } from 'react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { DocumentCard, isProcessing } from '@/components/DocumentCard'
import { UploadDropzone } from '@/components/UploadDropzone'
import { api } from '@/lib/api'
import { ProfileMenu } from '@/components/ProfileMenu'

type SortMode = 'recent' | 'progress' | 'active'

const POLL_MS = 4000

interface DocumentWithProgress {
  id: string
  title: string
  author?: string
  total_sectors: number
  processed_sectors?: number
  processing_status: string
  mastered?: number
  created_at: string
}

interface StatusResponse {
  processing_status: string
  total_sectors: number
  processed_sectors: number
}

export default function LibraryPage() {
  return <ProtectedRoute><Library /></ProtectedRoute>
}

function Library() {
  const [documents, setDocuments] = useState<DocumentWithProgress[]>([])
  const [sort, setSort] = useState<SortMode>('recent')

  const loadDocuments = useCallback(() => {
    api.get('/documents').then(setDocuments).catch(console.error)
  }, [])

  useEffect(loadDocuments, [loadDocuments])

  // While anything is processing, poll its real status.
  const processingIds = documents.filter(d => isProcessing(d.processing_status)).map(d => d.id).join(',')
  useEffect(() => {
    if (!processingIds) return
    const ids = processingIds.split(',')
    let finished = false

    const poll = async () => {
      const results = await Promise.all(
        ids.map(id => api.get(`/documents/${id}/status`).then(
          (s: StatusResponse) => [id, s] as const,
          () => null,
        )),
      )
      const updates = new Map(results.filter(r => r !== null))
      if (updates.size === 0) return
      setDocuments(prev => prev.map(d => {
        const s = updates.get(d.id)
        return s ? { ...d, ...s } : d
      }))
      // A document just finished or failed: reload to get its final details.
      if ([...updates.values()].some(s => !isProcessing(s.processing_status)) && !finished) {
        finished = true
        loadDocuments()
      }
    }

    poll()
    const timer = setInterval(poll, POLL_MS)
    return () => clearInterval(timer)
  }, [processingIds, loadDocuments])

  const removeDocument = async (id: string) => {
    try {
      await api.delete(`/documents/${id}`)
      setDocuments(prev => prev.filter(d => d.id !== id))
    } catch (e) {
      console.error(e)
      alert('Could not remove this document. Please try again.')
    }
  }

  const sorted = [...documents].sort((a, b) => {
    if (sort === 'progress') {
      const pctA = a.total_sectors > 0 ? (a.mastered ?? 0) / a.total_sectors : 0
      const pctB = b.total_sectors > 0 ? (b.mastered ?? 0) / b.total_sectors : 0
      return pctB - pctA
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  return (
    <main className="min-h-screen bg-black text-white p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Library</h1>
        <ProfileMenu />
      </div>
      <UploadDropzone
        onUploadStart={(docId) => {
          setDocuments(prev => [...prev, {
            id: docId,
            title: 'Processing...',
            processing_status: 'uploaded',
            total_sectors: 0,
            mastered: 0,
            created_at: new Date().toISOString()
          }])
          loadDocuments()  // picks up the real title
        }}
      />
      <div className="flex gap-2 mt-8 mb-4">
        {(['recent', 'progress', 'active'] as const).map(s => (
          <button
            key={s}
            onClick={() => setSort(s)}
            className={`px-3 py-1 rounded text-sm capitalize transition
              ${sort === s ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="grid gap-4 mt-2">
        {sorted.map(doc => (
          <DocumentCard
            key={doc.id}
            document={doc}
            masteredCount={doc.mastered ?? 0}
            onRemove={() => removeDocument(doc.id)}
          />
        ))}
        {sorted.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-8">
            No documents yet. Upload a PDF or EPUB, or paste an article link, to get started.
          </p>
        )}
      </div>
    </main>
  )
}
