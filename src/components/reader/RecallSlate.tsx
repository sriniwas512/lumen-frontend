'use client'
import { useState } from 'react'
import { api } from '@/lib/api'
import { RubricResult, GradingChecks } from './RubricResult'

interface EvalResult {
  status: string
  score: number
  rubric: {
    coverage: number
    causal: number
    evidence: number
    insight: number
    penalty: number
  }
  feedback: string
  hint?: string | null
  checks?: GradingChecks
  next_sector: string | null
  boss_fight_triggered: boolean
}

interface Props {
  sectorId: string
  onMastered: (nextSectorId: string | null, bossFightTriggered: boolean) => void
  onPassed?: () => void
  velocityLocked: boolean
  lockMessage?: string | null
}

export function RecallSlate({ sectorId, onMastered, onPassed, velocityLocked, lockMessage }: Props) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<EvalResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    if (!text.trim() || loading || text.trim().length < 50) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res: EvalResult = await api.post(`/sectors/${sectorId}/synthesize`, { content: text })
      setResult(res)
      if (res.status === 'mastered') onPassed?.()
    } catch (e) {
      console.error('Synthesis submission failed:', e)
      setError(errorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-8">
      <p className="text-gray-300 text-sm">
        In your own words, explain the core argument, the causal mechanism, and one implication.
      </p>
      <p className="text-gray-500 text-xs mt-1 mb-3">
        An AI grader scores it out of 10 for coverage, causal reasoning, evidence and insight.
        Score 6 or more to master this sector and unlock the next. Pasted text is rejected.
      </p>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        disabled={velocityLocked || loading || result?.status === 'mastered'}
        rows={8}
        className="w-full bg-gray-950 border border-gray-700 rounded-xl p-4 text-white resize-none focus:outline-none focus:border-blue-500 disabled:opacity-40 transition"
        placeholder={
          velocityLocked
            ? lockMessage ?? 'Read the sector fully before synthesizing...'
            : 'Write your synthesis here... (minimum 50 characters)'
        }
      />
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-gray-600">
          {text.length} chars {text.length < 50 && !velocityLocked ? '(min 50)' : ''}
        </span>
        <button
          onClick={submit}
          disabled={velocityLocked || loading || text.trim().length < 50 || result?.status === 'mastered'}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-40 hover:bg-blue-700 transition"
        >
          {loading ? 'Grading...' : result?.status === 'rejected' ? 'Resubmit' : 'Submit Synthesis'}
        </button>
      </div>
      {loading && (
        <div role="status" className="mt-4 flex items-center gap-3 text-sm text-gray-400">
          <span className="h-4 w-4 rounded-full border-2 border-gray-600 border-t-blue-500 animate-spin" />
          Grading your synthesis. This usually takes 5–15 seconds, a little longer if the score is close to the pass mark.
        </div>
      )}
      {error && (
        <p role="alert" className="mt-4 text-sm text-red-400 border border-red-900 bg-red-950/40 rounded-lg px-4 py-3">
          {error}
        </p>
      )}
      {result && (
        <RubricResult
          score={result.score}
          rubric={result.rubric}
          feedback={result.feedback}
          hint={result.hint}
          status={result.status}
          checks={result.checks}
        />
      )}
      {result?.status === 'mastered' && (
        <button
          onClick={() => onMastered(result.next_sector, result.boss_fight_triggered)}
          className="mt-4 px-5 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
        >
          {result.next_sector ? 'Continue to next sector →' : 'Finish'}
        </button>
      )}
    </div>
  )
}

// Errors arrive as Error(responseBody), where the body looks like {"detail": "..."}.
function errorMessage(e: unknown): string {
  if (e instanceof TypeError) {
    return "Couldn't reach the server. Check your connection and try again. If the server was asleep, it can take up to a minute to wake."
  }
  const raw = e instanceof Error ? e.message : ''
  try {
    const detail = JSON.parse(raw)?.detail
    if (typeof detail === 'string') return detail
    if (detail?.[0]?.msg) return detail[0].msg
  } catch {
    // not JSON
  }
  return 'Something went wrong while grading. Please try again.'
}
