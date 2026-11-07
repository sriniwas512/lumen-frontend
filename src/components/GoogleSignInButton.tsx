'use client'
import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// Google's own "Sign in with Google" button.
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

type CredentialResponse = { credential: string }

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize(config: {
            client_id: string
            callback: (response: CredentialResponse) => void
            nonce?: string
            use_fedcm_for_prompt?: boolean
          }): void
          renderButton(parent: HTMLElement, options: Record<string, unknown>): void
        }
      }
    }
  }
}

// One-time value tying the Google sign-in to this page load.
async function makeNonce(): Promise<[raw: string, hashed: string]> {
  const raw = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))))
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw))
  const hashed = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return [raw, hashed]
}

export function GoogleSignInButton() {
  const router = useRouter()
  const buttonRef = useRef<HTMLDivElement>(null)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // The script may already be loaded from an earlier visit to this page.
    if (window.google?.accounts?.id) setScriptLoaded(true)
  }, [])

  useEffect(() => {
    if (!scriptLoaded || !GOOGLE_CLIENT_ID || !buttonRef.current) return
    let cancelled = false

    makeNonce().then(([rawNonce, hashedNonce]) => {
      if (cancelled || !window.google || !buttonRef.current) return

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        nonce: hashedNonce,
        use_fedcm_for_prompt: true,
        callback: async ({ credential }) => {
          setError(null)
          const { error } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: credential,
            nonce: rawNonce,
          })
          if (error) {
            setError(error.message)
            return
          }
          router.replace('/library')
        },
      })

      window.google.accounts.id.renderButton(buttonRef.current, {
        type: 'standard',
        theme: 'filled_black',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
      })
    })

    return () => {
      cancelled = true
    }
  }, [scriptLoaded, router])

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onReady={() => setScriptLoaded(true)}
      />
      <div ref={buttonRef} className="min-h-[44px]" />
      {error && <p className="mt-4 text-sm text-red-400">Sign-in failed: {error}</p>}
    </>
  )
}

export const hasGoogleClientId = Boolean(GOOGLE_CLIENT_ID)
