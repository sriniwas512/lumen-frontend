interface Props {
  chapterTitle: string
  sectorIndex: number
  totalSectors: number
  masteredCount: number
}

export function FocusHUD({ chapterTitle, sectorIndex, totalSectors, masteredCount }: Props) {
  const momentum = Math.round((masteredCount / Math.max(totalSectors, 1)) * 100)
  return (
    <header className="fixed top-0 left-0 right-0 z-10 bg-black/90 backdrop-blur border-b border-gray-800 px-6 py-3 flex items-center justify-between">
      <div className="text-sm text-gray-400 truncate max-w-xs">{chapterTitle}</div>
      <div className="text-xs text-gray-500">
        Sector {sectorIndex + 1} / {totalSectors}
      </div>
      <div className="text-sm text-blue-400 font-mono">⚡ {momentum}%</div>
    </header>
  )
}
