'use client'
import { useState } from 'react'
import { api } from '@/lib/api'

interface Props {
  fightId: string
  challengeText: string
  onComplete: () => void
}

export function BossFightModal({ fightId, challengeText, onComplete }: Props) {
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ score: number; feedback: string } | null>(null)

  const submit = async () => {
    if (!response.trim() || loading || response.trim().length < 100) return
    setLoading(true)
    try {
      const res = await api.post(`/boss-fights/${fightId}/respond`, { response })
      setResult(res)
    } catch (e) {
      console.error('Boss fight submission failed:', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="mb-2 text-yellow-400 text-xs font-bold tracking-widest uppercase">
          Boss Fight
        </div>
        <h2 className="text-2xl font-bold text-white mb-6 leading-snug">
          {challengeText}
        </h2>

        {!result ? (
          <>
            <textarea
              value={response}
              onChange={e => setResponse(e.target.value)}
              rows={10}
              className="w-full bg-gray-950 border border-gray-700 rounded-xl p-4 text-white resize-none focus:outline-none focus:border-yellow-500 transition"
              placeholder="Apply the book's framework to answer this challenge... (minimum 100 characters)"
            />
            <div className="flex items-center justify-between mt-4">
              <span className="text-xs text-gray-600">
                {response.length} chars {response.length < 100 ? '(min 100)' : ''}
              </span>
              <button
                onClick={submit}
                disabled={loading || response.trim().length < 100}
                className="px-6 py-3 bg-yellow-500 text-black font-bold rounded-lg disabled:opacity-40 hover:bg-yellow-400 transition"
              >
                {loading ? 'Evaluating...' : 'Submit'}
              </button>
            </div>
          </>
        ) : (
          <div className="bg-gray-900 rounded-xl p-6 border border-yellow-700">
            <p className="text-yellow-400 text-3xl font-bold mb-3">
              {result.score}/10
            </p>
            <p className="text-gray-300 leading-relaxed">{result.feedback}</p>
            <button
              onClick={onComplete}
              className="mt-6 px-5 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition font-medium"
            >
              Continue Reading
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
