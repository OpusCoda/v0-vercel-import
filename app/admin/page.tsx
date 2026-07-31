'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { LogOut } from 'lucide-react'
import { AdminLogin } from '@/components/admin/admin-login'
import { CreateMarketForm } from '@/components/admin/create-market-form'
import { ConnectWalletButton } from '@/components/landing/connect-wallet-button'

type AdminTab = 'resolve' | 'create-market' | 'manage-admins'

const tabs: { id: AdminTab; label: string }[] = [
  { id: 'resolve', label: 'Disputes & Resolutions' },
  { id: 'create-market', label: 'Create Market' },
  { id: 'manage-admins', label: 'Manage Admins' },
]

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<AdminTab>('resolve')

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
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <Link href="/" className="font-sans text-sm text-[#d4af37] hover:underline">
            ← Back to home
          </Link>
          <h1 className="mt-2 font-serif text-3xl font-bold text-[#d4af37]">Admin Panel</h1>
        </div>
        <div className="flex items-center gap-3">
          <ConnectWalletButton />
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg border border-[#d4af37]/40 px-3 py-2 font-sans text-sm font-semibold text-[#d4af37] transition-colors hover:bg-[#d4af37]/10"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-8 flex flex-wrap gap-3 border-b border-[#2a2a35] pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-full border px-4 py-2 font-sans text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'border-[#d8b13d] bg-[#d8b13d]/10 text-[#d8b13d]'
                : 'border-[#2a2a35] text-[#9a9a9a] hover:border-[#3a3a45] hover:text-[#b8b6b1]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'resolve' && (
        <section>
          <div className="mb-6">
            <h2 className="font-serif text-2xl font-bold text-[#e8e6e3]">Disputes &amp; Resolutions</h2>
            <p className="mt-2 font-sans text-sm text-[#7c7a76]">
              Markets and wagers awaiting resolution or arbitration will appear here.
            </p>
          </div>
          <div className="rounded-lg border border-[#2a2a35] bg-[#101017] p-8 text-center">
            <p className="font-sans text-sm text-[#7c7a76]">Nothing awaiting resolution right now.</p>
          </div>
        </section>
      )}

      {activeTab === 'create-market' && (
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
      )}

      {activeTab === 'manage-admins' && (
        <section>
          <div className="mb-6">
            <h2 className="font-serif text-2xl font-bold text-[#e8e6e3]">Manage Admins</h2>
            <p className="mt-2 font-sans text-sm text-[#7c7a76]">
              Add or remove authorized admin wallets.
            </p>
          </div>
          <div className="rounded-lg border border-[#2a2a35] bg-[#101017] p-8 text-center">
            <p className="font-sans text-sm text-[#7c7a76]">Coming soon.</p>
          </div>
        </section>
      )}
    </main>
  )
}