'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { api } from '@/lib/api'

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false })

const NODE_COLORS: Record<string, string> = {
  concept: '#3b82f6',
  entity: '#10b981',
  causal: '#f59e0b',
  contradiction: '#ef4444',
}

interface GraphNode {
  id: string
  node_type: string
  label: string
  data?: Record<string, unknown>
  confidence?: number
}

interface GraphEdge {
  id: string
  source_node_id: string
  target_node_id: string
  edge_type: string
  weight?: number
}

export default function GraphPage() {
  return <ProtectedRoute><Topology /></ProtectedRoute>
}

function Topology() {
  const { docId } = useParams<{ docId: string }>()
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; links: unknown[] }>({ nodes: [], links: [] })
  const [selected, setSelected] = useState<GraphNode | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get(`/graph/${docId}?limit=200&depth=2`).then((data: { nodes: GraphNode[]; edges: GraphEdge[] }) => {
      const nodes = data.nodes.map(n => ({ ...n, id: n.id }))
      const links = (data.edges || []).map(e => ({
        source: e.source_node_id,
        target: e.target_node_id,
        type: e.edge_type,
      }))
      setGraphData({ nodes, links })
    }).catch(console.error)
  }, [docId])

  const filteredNodes = search
    ? graphData.nodes.filter(n => n.label.toLowerCase().includes(search.toLowerCase()))
    : graphData.nodes

  return (
    <main className="min-h-screen bg-black text-white flex">
      <div className="flex-1 relative">
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search concepts..."
            className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 w-52"
          />
        </div>
        <ForceGraph2D
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          graphData={{ nodes: filteredNodes as any[], links: graphData.links as any[] }}
          nodeLabel="label"
          nodeColor={(n: any) => NODE_COLORS[n.node_type as string] ?? '#6b7280'}
          linkColor={() => '#374151'}
          onNodeClick={(node: any) => setSelected(node as GraphNode)}
          backgroundColor="#000000"
        />
      </div>
      {selected && (
        <aside className="w-80 border-l border-gray-800 p-6 overflow-y-auto shrink-0">
          <button
            onClick={() => setSelected(null)}
            className="text-gray-500 text-sm mb-4 hover:text-white transition"
          >
            ← Close
          </button>
          <h3 className="text-white font-bold text-lg">{selected.label}</h3>
          <p className="text-gray-400 text-xs mt-1 uppercase tracking-wider">{selected.node_type}</p>
          {selected.data && typeof selected.data === 'object' && (
            <div className="mt-4 text-gray-300 text-sm space-y-1">
              {Object.entries(selected.data).map(([k, v]) => (
                <p key={k}><span className="text-gray-500">{k}:</span> {String(v)}</p>
              ))}
            </div>
          )}
          {selected.confidence !== undefined && (
            <p className="text-gray-500 text-xs mt-4">
              Confidence: {((selected.confidence) * 100).toFixed(0)}%
            </p>
          )}
        </aside>
      )}
    </main>
  )
}
