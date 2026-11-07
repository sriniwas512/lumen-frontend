'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

// The chosen name is saved with the account, so it follows the user to any device.
function displayName(meta: Record<string, unknown> | undefined, email?: string) {
  const pick = (k: string) => (typeof meta?.[k] === 'string' && (meta[k] as string).trim()) || ''
  return pick('display_name') || pick('full_name') || pick('name') || email?.split('@')[0] || 'Reader'
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase() || '?'
}

export function ProfileMenu() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  const meta = user?.user_metadata as Record<string, unknown> | undefined
  const name = displayName(meta, user?.email)
  const avatar = typeof meta?.avatar_url === 'string' ? meta.avatar_url : null

  // Close when clicking outside or pressing Escape.
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      setEditing(false)
      setError(null)
    }
  }, [open])

  if (!user) return null

  const startEditing = () => {
    setDraft(name)
    setEditing(true)
    setError(null)
  }

  const saveName = async () => {
    const next = draft.trim()
    if (!next) return setError('Please enter a name.')
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ data: { display_name: next.slice(0, 60) } })
    setSaving(false)
    if (error) return setError("Couldn't save your name. Please try again.")
    setEditing(false)
  }

  const logOut = async () => {
    await signOut()
    router.replace('/login')
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Profile menu"
        aria-expanded={open}
        className="h-8 w-8 rounded-full overflow-hidden bg-blue-600 text-white text-xs font-semibold flex items-center justify-center ring-1 ring-gray-700 hover:ring-gray-400 transition"
      >
        {avatar
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={avatar} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
          : initials(name)}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl border border-gray-700 bg-gray-950 shadow-xl p-4 z-30">
          {editing ? (
            <form onSubmit={e => { e.preventDefault(); saveName() }}>
              <label className="text-xs text-gray-500" htmlFor="profile-name">Your name</label>
              <input
                id="profile-name"
                autoFocus
                value={draft}
                maxLength={60}
                onChange={e => setDraft(e.target.value)}
                className="mt-1 w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
              {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
              <div className="mt-3 flex gap-2 justify-end">
                <button type="button" onClick={() => setEditing(false)} className="px-3 py-1.5 text-sm text-gray-400 hover:text-white">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          ) : (
            <>
              <p className="text-white font-medium truncate">{name}</p>
              {user.email && <p className="text-xs text-gray-500 truncate">{user.email}</p>}
              <button onClick={startEditing} className="mt-3 w-full text-left text-sm text-gray-300 hover:text-white py-1.5">
                Change name
              </button>
            </>
          )}
          <div className="mt-2 pt-2 border-t border-gray-800">
            <button onClick={logOut} className="w-full text-left text-sm text-red-400 hover:text-red-300 py-1.5">
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
