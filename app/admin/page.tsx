'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { LogOut } from 'lucide-react'
import { AdminLogin } from '@/components/admin/admin-login'
import { CreateMarketForm } from '@/components/admin/create-market-form'

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if admin token exists in sessionStorage
    const token = sessionStorage.getItem('admin_token')
    setIsAuthenticated(!!token)
    setIsLoading(false)
  }, [])

  const handleLogout = () => {
    sessionStorage.removeItem('admin_token')
    setIsAuthenticated(false)
  }

  if (isLoading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <p className="font-sans text-[#7c7a76]">Loading...</p>
      </main>
    )
  }

  if (!isAuthenticated) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="mb-8">
          <Link href="/" className="font-sans text-sm text-[#d4af37] hover:underline">
            ← Back to home
          </Link>
        </div>
        <AdminLogin onSuccess={() => setIsAuthenticated(true)} />
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 md:px-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link href="/" className="font-sans text-sm text-[#d4af37] hover:underline">
            ← Back to home
          </Link>
          <h1 className="mt-2 font-serif text-3xl font-bold text-[#d4af37]">Admin Panel</h1>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-lg border border-[#d4af37]/40 px-3 py-2 font-sans text-sm font-semibold text-[#d4af37] transition-colors hover:bg-[#d4af37]/10"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>

      {/* Main Content */}
      <div className="grid gap-12 lg:grid-cols-3">
        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <div className="sticky top-8 rounded-lg border border-[#2a2a35] bg-[#101017] p-6">
            <h2 className="mb-4 font-serif text-lg font-bold text-[#e8e6e3]">Admin Tasks</h2>
            <nav className="space-y-3">
              <div>
                <p className="font-sans text-xs font-semibold uppercase tracking-wide text-[#7c7a76]">
                  Probability Shop
                </p>
                <button className="mt-2 w-full text-left rounded-lg border border-[#d4af37] bg-[#d4af37]/10 px-3 py-2 font-sans text-sm text-[#d4af37] transition-colors hover:bg-[#d4af37]/20">
                  ✓ Create Market
                </button>
              </div>
              <div>
                <p className="font-sans text-xs font-semibold uppercase tracking-wide text-[#7c7a76]">
                  Manage Admins
                </p>
                <p className="mt-2 font-sans text-xs text-[#7c7a76]">Coming soon</p>
              </div>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-12">
          {/* Create Market Section */}
          <section>
            <div className="mb-6">
              <h2 className="font-serif text-2xl font-bold text-[#e8e6e3]">Create Probability Market</h2>
              <p className="mt-2 font-sans text-sm text-[#7c7a76]">
                Create a new YES/NO binary market for the Probability Shop. You must be connected with
                an authorized wallet to proceed.
              </p>
            </div>
            <CreateMarketForm />
          </section>
        </div>
      </div>
    </main>
  )
}
