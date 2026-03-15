'use client'
import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface Props {
  onUploadStart: (docId: string, jobId: string) => void
}

export function UploadDropzone({ onUploadStart }: Props) {
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleFile = useCallback(async (file: File) => {
    setError(null)
    const supported = ['application/pdf', 'application/epub+zip']
    if (!supported.includes(file.type)) {
      setError('Only PDF and EPUB files are supported')
      return
    }
    setUploading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const formData = new FormData()
      formData.append('file', file)
      const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const r = await fetch(`${BASE}/documents/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session?.access_token ?? ''}` },
        body: formData
      })
      if (!r.ok) throw new Error(await r.text())
      const { document_id, job_id } = await r.json()
      onUploadStart(document_id, job_id)
    } catch {
      setError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }, [onUploadStart])

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => {
        e.preventDefault()
        setDragging(false)
        const f = e.dataTransfer.files[0]
        if (f) handleFile(f)
      }}
      className={`border-2 border-dashed rounded-xl p-10 text-center transition cursor-pointer
        ${dragging ? 'border-blue-400 bg-blue-950' : 'border-gray-700 hover:border-gray-500'}`}
    >
      <input
        type="file"
        accept=".pdf,.epub"
        className="hidden"
        id="file-input"
        onChange={e => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
        }}
      />
      <label htmlFor="file-input" className="cursor-pointer">
        <p className="text-gray-300">
          {uploading
            ? 'Uploading...'
            : <>Drop a PDF or EPUB here, or <span className="text-blue-400 underline">browse</span></>
          }
        </p>
      </label>
      {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
    </div>
  )
}
