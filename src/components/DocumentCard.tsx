import Link from 'next/link'

interface Document {
  id: string
  title: string
  author?: string
  total_sectors: number
  processed_sectors?: number
  processing_status: string
}

interface Props {
  document: Document
  masteredCount: number
  onRemove?: () => void
}

const STAGE_LABELS: Record<string, string> = {
  uploaded: 'Queued',
  parsing: 'Reading the file',
  sectorizing: 'Splitting into sectors',
  embedding: 'Analyzing sectors',
}

export const isProcessing = (status: string) =>
  Object.prototype.hasOwnProperty.call(STAGE_LABELS, status)

export function DocumentCard({ document: doc, masteredCount, onRemove }: Props) {
  const pct = doc.total_sectors > 0
    ? Math.round((masteredCount / doc.total_sectors) * 100)
    : 0

  if (doc.processing_status === 'failed') {
    return (
      <div className="border border-red-900 rounded-xl p-5 bg-gray-900 flex items-start justify-between gap-4">
        <div>
          <p className="text-white font-semibold">{doc.title}</p>
          <p className="text-red-400 text-sm mt-1">
            Processing stopped before it finished. Remove it and upload the file again.
          </p>
        </div>
        {onRemove && (
          <button
            onClick={onRemove}
            className="shrink-0 px-3 py-1.5 text-sm rounded-lg border border-gray-600 text-gray-300 hover:border-gray-400 hover:text-white transition"
          >
            Remove
          </button>
        )}
      </div>
    )
  }

  if (doc.processing_status !== 'ready') {
    const total = doc.total_sectors
    const done = doc.processed_sectors ?? 0
    const showCount = doc.processing_status === 'embedding' && total > 0
    return (
      <div className="border border-gray-700 rounded-xl p-5 bg-gray-900">
        <p className="text-white font-semibold">{doc.title}</p>
        <p className="text-gray-500 text-sm mt-1">
          {STAGE_LABELS[doc.processing_status] ?? doc.processing_status}...
          {showCount && ` ${done} / ${total} sectors`}
        </p>
        {showCount && (
          <div className="mt-3 h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gray-400 rounded-full transition-all"
              style={{ width: `${Math.round((done / total) * 100)}%` }}
            />
          </div>
        )}
      </div>
    )
  }

  const confirmRemove = () => {
    if (onRemove && window.confirm(
      `Remove "${doc.title}" from your library?\n\nThis permanently deletes the book, your progress and all your notes for it. It can't be undone.`
    )) onRemove()
  }

  return (
    <div className="border border-gray-700 rounded-xl bg-gray-900 hover:border-gray-500 transition">
      <Link href={`/read/${doc.id}`} className="block p-5 pb-3">
        <p className="text-white font-semibold">{doc.title}</p>
        {doc.author && (
          <p className="text-gray-400 text-sm mt-0.5">{doc.author}</p>
        )}
        <div className="mt-4 h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-gray-500 text-xs mt-1">
          {masteredCount} / {doc.total_sectors} sectors mastered
        </p>
      </Link>
      <div className="flex items-center gap-4 px-5 pb-4 text-sm">
        <Link href={`/read/${doc.id}`} className="text-blue-400 hover:text-blue-300">Continue reading</Link>
        <Link href={`/notes/${doc.id}`} className="text-gray-400 hover:text-white">My notes</Link>
        {onRemove && (
          <button onClick={confirmRemove} className="ml-auto text-gray-500 hover:text-red-400">
            Remove
          </button>
        )}
      </div>
    </div>
  )
}
