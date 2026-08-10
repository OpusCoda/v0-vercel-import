'use client'

import { useState } from 'react'
import { Lock } from 'lucide-react'

interface AdminLoginProps {
  onSuccess: () => void
}

export function AdminLogin({ onSuccess }: AdminLoginProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Invalid password')
        return
      }

      // Store token in sessionStorage (not localStorage for security)
      sessionStorage.setItem('admin_token', data.token)
      onSuccess()
    } catch (err) {
      setError('An error occurred. Please try again.')
      console.error('Admin login error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-lg border border-[#2a2a35] bg-[#101017] p-8">
        <div className="mb-6 flex items-center justify-center gap-2">
          <Lock className="h-5 w-5 text-[#B87333]" />
          <h1 className="font-serif text-2xl font-bold text-[#e8e6e3]">Admin Access</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-sans text-sm font-semibold text-[#e8e6e3] mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="w-full rounded-lg border border-[#2a2a35] bg-[#0d0d12] px-3 py-2 font-sans text-sm text-[#e8e6e3] placeholder-[#7c7a76] focus:border-[#B87333] focus:outline-none"
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
              <p className="font-sans text-sm text-red-400">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={!password || isLoading}
            className="w-full rounded-lg border border-[#B87333] bg-[#B87333]/10 px-4 py-2 font-sans font-semibold text-[#B87333] transition-colors hover:bg-[#B87333]/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Verifying...' : 'Enter'}
          </button>
        </form>
      </div>
    </div>
  )
}
