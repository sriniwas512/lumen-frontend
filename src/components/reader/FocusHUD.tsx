import Link from 'next/link'
import { ProfileMenu } from '@/components/ProfileMenu'

interface Props {
  docId: string
  chapterTitle: string
  sectorIndex: number
  totalSectors: number
  masteredCount: number
}

export function FocusHUD({ docId, chapterTitle, sectorIndex, totalSectors, masteredCount }: Props) {
  return (
    <header className="fixed top-0 left-0 right-0 z-10 bg-black/90 backdrop-blur border-b border-gray-800 px-4 sm:px-6 py-3 flex items-center justify-between gap-3 whitespace-nowrap">
      <div className="flex items-center gap-4 min-w-0">
        <Link href="/library" className="text-sm text-gray-400 hover:text-white shrink-0">← Library</Link>
        <span className="text-sm text-gray-500 truncate max-w-xs hidden md:inline">{chapterTitle}</span>
      </div>
      <div className="text-xs text-gray-500">
        <span className="hidden sm:inline">Sector </span>{sectorIndex + 1} / {totalSectors}
      </div>
      <div className="flex items-center gap-3 sm:gap-4">
        <Link href={`/notes/${docId}`} className="text-sm text-gray-400 hover:text-white">Notes</Link>
        <span className="text-sm text-blue-400 font-mono" title="Sectors mastered">
          ⚡ {masteredCount}<span className="hidden sm:inline"> mastered</span>
        </span>
        <ProfileMenu />
      </div>
    </header>
  )
}
