'use client'
import { useAuth } from '@/hooks/useAuth'

export default function LoginPage() {
  const { signInWithGoogle } = useAuth()
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
      <h1 className="text-4xl font-bold mb-2 tracking-tight">Lumen</h1>
      <p className="text-gray-400 mb-12 text-sm">Cognitive Mastery Engine</p>
      <button
        onClick={signInWithGoogle}
        className="px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition"
      >
        Continue with Google
      </button>
    </main>
  )
}
