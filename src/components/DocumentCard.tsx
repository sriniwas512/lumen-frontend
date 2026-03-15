import Link from 'next/link'

interface Document {
  id: string
  title: string
  author?: string
  total_sectors: number
  processing_status: string
}

interface Props {
  document: Document
  masteredCount: number
}

export function DocumentCard({ document: doc, masteredCount }: Props) {
  const pct = doc.total_sectors > 0
    ? Math.round((masteredCount / doc.total_sectors) * 100)
    : 0

  if (doc.processing_status !== 'ready') {
    return (
      <div className="border border-gray-700 rounded-xl p-5 bg-gray-900">
        <p className="text-white font-semibold">{doc.title}</p>
        <p className="text-gray-500 text-sm mt-1 capitalize">{doc.processing_status}...</p>
      </div>
    )
  }

  return (
    <Link
      href={`/read/${doc.id}`}
      className="block border border-gray-700 rounded-xl p-5 bg-gray-900 hover:border-gray-500 transition"
    >
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
  )
}
