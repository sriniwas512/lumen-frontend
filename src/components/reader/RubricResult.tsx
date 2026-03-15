interface Rubric {
  coverage: number
  causal: number
  evidence: number
  insight: number
  penalty: number
}

interface Props {
  score: number
  rubric: Rubric
  feedback: string
  hint?: string | null
  status: string
}

const BARS = [
  { key: 'coverage' as const, max: 3, label: 'Coverage' },
  { key: 'causal' as const, max: 3, label: 'Causal Reasoning' },
  { key: 'evidence' as const, max: 2, label: 'Evidence' },
  { key: 'insight' as const, max: 2, label: 'Insight' },
]

export function RubricResult({ score, rubric, feedback, hint, status }: Props) {
  const mastered = status === 'mastered'
  return (
    <div className="mt-6 p-5 bg-gray-900 rounded-xl border border-gray-700">
      <p className={`text-lg font-bold mb-4 ${mastered ? 'text-green-400' : 'text-yellow-400'}`}>
        {mastered ? '✓ Mastered' : '↻ Re-scan required'} — Score: {score}
      </p>
      <div className="space-y-2 mb-4">
        {BARS.map(b => {
          const val = Math.max(0, rubric[b.key])
          const pct = (val / b.max) * 100
          return (
            <div key={b.key} className="flex items-center gap-3">
              <span className="text-xs text-gray-400 w-32 shrink-0">{b.label}</span>
              <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 w-10 text-right">{val}/{b.max}</span>
            </div>
          )
        })}
        {rubric.penalty < 0 && (
          <p className="text-red-400 text-xs mt-1">Misinterpretation penalty: {rubric.penalty}</p>
        )}
      </div>
      <p className="text-gray-300 text-sm leading-relaxed">{feedback}</p>
      {hint && (
        <p className="mt-3 text-yellow-300 text-sm border-l-2 border-yellow-500 pl-3">{hint}</p>
      )}
    </div>
  )
}
