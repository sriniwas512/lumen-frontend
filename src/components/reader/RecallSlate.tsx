'use client'
import { useState } from 'react'
import { api } from '@/lib/api'
import { RubricResult } from './RubricResult'

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
  next_sector: string | null
  boss_fight_triggered: boolean
}

interface Props {
  sectorId: string
  onMastered: (nextSectorId: string | null, bossFightTriggered: boolean) => void
  velocityLocked: boolean
}

export function RecallSlate({ sectorId, onMastered, velocityLocked }: Props) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<EvalResult | null>(null)

  const submit = async () => {
    if (!text.trim() || loading || text.trim().length < 50) return
    setLoading(true)
    try {
      const res: EvalResult = await api.post(`/sectors/${sectorId}/synthesize`, { content: text })
      setResult(res)
      if (res.status === 'mastered') {
        onMastered(res.next_sector, res.boss_fight_triggered)
      }
    } catch (e) {
      console.error('Synthesis submission failed:', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-8">
      <p className="text-gray-400 text-sm mb-2">
        Synthesize the core argument, the causal mechanism, and one implication.
      </p>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        disabled={velocityLocked || loading}
        rows={8}
        className="w-full bg-gray-950 border border-gray-700 rounded-xl p-4 text-white resize-none focus:outline-none focus:border-blue-500 disabled:opacity-40 transition"
        placeholder={
          velocityLocked
            ? 'Read the sector fully before synthesizing...'
            : 'Write your synthesis here... (minimum 50 characters)'
        }
      />
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-gray-600">
          {text.length} chars {text.length < 50 && !velocityLocked ? '(min 50)' : ''}
        </span>
        <button
          onClick={submit}
          disabled={velocityLocked || loading || text.trim().length < 50}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-40 hover:bg-blue-700 transition"
        >
          {loading ? 'Evaluating...' : 'Submit Synthesis'}
        </button>
      </div>
      {result && (
        <RubricResult
          score={result.score}
          rubric={result.rubric}
          feedback={result.feedback}
          hint={result.hint}
          status={result.status}
        />
      )}
    </div>
  )
}
