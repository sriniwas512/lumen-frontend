'use client'
import { useEffect, useState } from 'react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { api } from '@/lib/api'
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from 'recharts'

type RangeMode = '7d' | '30d' | 'all'
type StrengthLevel = 'weak' | 'moderate' | 'strong'

const LEVELS: Record<StrengthLevel, number> = { weak: 1, moderate: 2, strong: 3 }

interface ReasoningProfile {
  causal_reasoning?: StrengthLevel
  evidence_usage?: StrengthLevel
  synthesis_skill?: StrengthLevel
  conceptual_linking?: StrengthLevel
  pattern_notes?: string
}

interface ProfileData {
  reasoning_profile: ReasoningProfile
  recommendations: string[]
}

interface AnalyticsData {
  mastered_sectors: number
  events: unknown[]
  range: string
}

export default function AnalyticsPage() {
  return <ProtectedRoute><Analytics /></ProtectedRoute>
}

function Analytics() {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [range, setRange] = useState<RangeMode>('7d')

  useEffect(() => {
    Promise.all([
      api.get('/users/me/profile'),
      api.get(`/users/me/analytics?range=${range}`),
    ]).then(([p, a]) => {
      setProfile(p)
      setAnalytics(a)
    }).catch(console.error)
  }, [range])

  const radarData = profile ? [
    { subject: 'Causal', value: LEVELS[profile.reasoning_profile.causal_reasoning ?? 'weak'] },
    { subject: 'Evidence', value: LEVELS[profile.reasoning_profile.evidence_usage ?? 'weak'] },
    { subject: 'Synthesis', value: LEVELS[profile.reasoning_profile.synthesis_skill ?? 'weak'] },
    { subject: 'Linking', value: LEVELS[profile.reasoning_profile.conceptual_linking ?? 'weak'] },
  ] : []

  return (
    <main className="min-h-screen bg-black text-white p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Analytics</h1>
      <div className="flex gap-2 mb-8">
        {(['7d', '30d', 'all'] as const).map(r => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`px-3 py-1 rounded text-sm transition ${
              range === r ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h2 className="text-sm text-gray-400 uppercase tracking-wider mb-4">Reasoning Profile</h2>
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Radar dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-sm">No profile data yet.</p>
          )}
          {profile?.recommendations?.map((rec, i) => (
            <p key={i} className="text-yellow-300 text-xs mt-2 border-l-2 border-yellow-500 pl-2">
              {rec}
            </p>
          ))}
          {profile?.reasoning_profile.pattern_notes && (
            <p className="text-gray-400 text-xs mt-3 italic">
              {profile.reasoning_profile.pattern_notes}
            </p>
          )}
        </div>

        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h2 className="text-sm text-gray-400 uppercase tracking-wider mb-4">Progress</h2>
          <p className="text-5xl font-bold text-white">{analytics?.mastered_sectors ?? 0}</p>
          <p className="text-gray-400 text-sm mt-1">sectors mastered</p>
          <p className="text-gray-500 text-xs mt-4">
            {analytics?.events?.length ?? 0} events in the last {range}
          </p>
        </div>
      </div>
    </main>
  )
}
