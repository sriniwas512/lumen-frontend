import { supabase } from './supabase'

async function getHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession()
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token ?? ''}`
  }
}

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const api = {
  get: async (path: string) => {
    const r = await fetch(`${BASE}${path}`, { headers: await getHeaders() })
    if (!r.ok) throw new Error(await r.text())
    return r.json()
  },
  post: async (path: string, body: unknown) => {
    const r = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify(body)
    })
    if (!r.ok) throw new Error(await r.text())
    return r.json()
  }
}
