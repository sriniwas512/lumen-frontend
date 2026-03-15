'use client'
import { useEffect, useState } from 'react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { DocumentCard } from '@/components/DocumentCard'
import { UploadDropzone } from '@/components/UploadDropzone'
import { api } from '@/lib/api'

type SortMode = 'recent' | 'progress' | 'active'

interface DocumentWithProgress {
  id: string
  title: string
  author?: string
  total_sectors: number
  processing_status: string
  mastered?: number
  created_at: string
}

export default function LibraryPage() {
  return <ProtectedRoute><Library /></ProtectedRoute>
}

function Library() {
  const [documents, setDocuments] = useState<DocumentWithProgress[]>([])
  const [sort, setSort] = useState<SortMode>('recent')

  useEffect(() => {
    api.get('/documents').then(setDocuments).catch(console.error)
  }, [])

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
      <h1 className="text-3xl font-bold mb-8">Library</h1>
      <UploadDropzone
        onUploadStart={(docId, jobId) => {
          setDocuments(prev => [...prev, {
            id: docId,
            title: 'Processing...',
            processing_status: 'parsing',
            total_sectors: 0,
            mastered: 0,
            created_at: new Date().toISOString()
          }])
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
          />
        ))}
        {sorted.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-8">
            No documents yet. Upload a PDF or EPUB to get started.
          </p>
        )}
      </div>
    </main>
  )
}
