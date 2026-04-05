'use client'
import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface EpubSection {
  index: number
  title: string
  preview: string
  word_count: number
}

interface Props {
  onUploadStart: (docId: string, jobId: string) => void
}

export function UploadDropzone({ onUploadStart }: Props) {
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [sections, setSections] = useState<EpubSection[] | null>(null)
  const [startSection, setStartSection] = useState(0)
  const [loadingSections, setLoadingSections] = useState(false)

  const handleFile = useCallback(async (file: File) => {
    setError(null)
    const supported = ['application/pdf', 'application/epub+zip']
    if (!supported.includes(file.type)) {
      setError('Only PDF and EPUB files are supported')
      return
    }

    if (file.type === 'application/epub+zip') {
      // For EPUBs, fetch sections first so the user can skip front matter
      setLoadingSections(true)
      setPendingFile(file)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        const form = new FormData()
        form.append('file', file)
        const r = await fetch(`${BASE}/epub/sections`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${session?.access_token ?? ''}` },
          body: form,
        })
        if (!r.ok) throw new Error(await r.text())
        const { sections: s } = await r.json()
        setSections(s)
        setStartSection(0)
      } catch {
        setError('Could not read EPUB sections. Upload will start from the beginning.')
        setSections(null)
      } finally {
        setLoadingSections(false)
      }
    } else {
      await uploadFile(file, 0)
    }
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  const uploadFile = useCallback(async (file: File, fromSection: number) => {
    setUploading(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const formData = new FormData()
      formData.append('file', file)
      formData.append('start_section', String(fromSection))
      const r = await fetch(`${BASE}/documents/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session?.access_token ?? ''}` },
        body: formData,
      })
      if (!r.ok) throw new Error(await r.text())
      const { document_id, job_id } = await r.json()
      onUploadStart(document_id, job_id)
      setSections(null)
      setPendingFile(null)
    } catch {
      setError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }, [onUploadStart])

  const confirmUpload = () => {
    if (pendingFile) uploadFile(pendingFile, startSection)
  }

  const cancelPicker = () => {
    setSections(null)
    setPendingFile(null)
    setStartSection(0)
    setError(null)
  }

  // Section picker shown after EPUB is selected
  if (sections) {
    return (
      <div className="border border-gray-700 rounded-xl p-6 bg-gray-900">
        <div className="flex items-center justify-between mb-4">
          <p className="text-white font-semibold text-sm">
            {pendingFile?.name} — choose where to start
          </p>
          <button onClick={cancelPicker} className="text-gray-500 hover:text-gray-300 text-xs">
            Cancel
          </button>
        </div>
        <p className="text-gray-400 text-xs mb-3">
          Skip front matter, copyright pages, and indexes by selecting the first real chapter.
        </p>
        <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
          {sections.map(s => (
            <button
              key={s.index}
              onClick={() => setStartSection(s.index)}
              className={`w-full text-left px-3 py-2.5 rounded-lg transition text-sm
                ${startSection === s.index
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'}`}
            >
              <span className="font-medium truncate block">{s.title}</span>
              <span className="text-xs opacity-60 truncate block">{s.preview}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between mt-4">
          <p className="text-gray-500 text-xs">
            Starting from section {startSection + 1} of {sections.length}
          </p>
          <button
            onClick={confirmUpload}
            disabled={uploading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition"
          >
            {uploading ? 'Uploading...' : 'Upload from here'}
          </button>
        </div>
        {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
      </div>
    )
  }

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
          {loadingSections
            ? 'Reading sections...'
            : uploading
            ? 'Uploading...'
            : <>Drop a PDF or EPUB here, or <span className="text-blue-400 underline">browse</span></>
          }
        </p>
      </label>
      {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
    </div>
  )
}
