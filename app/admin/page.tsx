'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { LogOut } from 'lucide-react'
import { useAccount, useReadContract } from 'wagmi'
import type { Address } from 'viem'
import { AdminLogin } from '@/components/admin/admin-login'
import { CreateMarketForm } from '@/components/admin/create-market-form'
import { WagerArbitration } from '@/components/admin/wager-arbitration'
import { ProcessBurnPanel, SweepAbandonedPanel } from '@/components/admin/maintenance-panels'
import { ManageAdmins } from '@/components/admin/manage-admins'
import { ManageArbitrators } from '@/components/admin/manage-arbitrators'
import { ManageResolver } from '@/components/admin/manage-resolver'
import { SweepPanel } from '@/components/admin/sweep-panel'
import { DisputesResolutions } from '@/components/admin/disputes-resolutions'
import { ConnectWalletButton } from '@/components/landing/connect-wallet-button'
import { predictionMarketAbi } from '@/lib/abis/prediction-market'
import { outcomeExchangeAbi } from '@/lib/abis/outcome-exchange'

const PREDICTION_MARKET_ADDRESS =
  (process.env.NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS as Address) ||
  ('0x302Ab8bdc02235CB9b428DE1EDA6A978A819B691' as Address)

const OUTCOME_EXCHANGE_ADDRESS = '0x6FaE169714ba3BE839332785291f798d627BCE8c' as Address

type AdminTab =
  | 'resolve'
  | 'create-market'
  | 'manage-admins'
  | 'manage-arbitrators'
  | 'manage-resolver'
  | 'sweep'

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<AdminTab>('resolve')

  const { address } = useAccount()

  useEffect(() => {
    const token = sessionStorage.getItem('admin_token')
    setIsAuthenticated(!!token)
    setIsLoading(false)
  }, [])

  const handleLogout = () => {
    sessionStorage.removeItem('admin_token')
    setIsAuthenticated(false)
  }

  // Owner checks drive which management tabs are visible (Option B — hide).
  const { data: pmOwner } = useReadContract({
    address: PREDICTION_MARKET_ADDRESS,
    abi: predictionMarketAbi,
    functionName: 'owner',
    query: { enabled: isAuthenticated },
  })
  const { data: oeOwner } = useReadContract({
    address: OUTCOME_EXCHANGE_ADDRESS,
    abi: outcomeExchangeAbi,
    functionName: 'owner',
    query: { enabled: isAuthenticated },
  })
  const { data: pmIsAdmin } = useReadContract({
    address: PREDICTION_MARKET_ADDRESS,
    abi: predictionMarketAbi,
    functionName: 'isAdmin',
    args: address ? [address] : undefined,
    query: { enabled: isAuthenticated && !!address },
  })

  const isPmOwner = Boolean(address) && pmOwner?.toLowerCase() === address?.toLowerCase()
  const isOeOwner = Boolean(address) && oeOwner?.toLowerCase() === address?.toLowerCase()

  // Tab visibility:
  //   - Disputes & Resolutions: always (default landing).
  //   - Create Market: hidden for now. NOTE: createMarket is onlyAdmin (admins + owner),
  //     so when you add other admins, change this gate to show for admins too
  //     (e.g. read isAdmin(address) and OR it with isPmOwner).
  //   - Manage Admins: PredictionMarket owner only.
  //   - Manage Arbitrators: OutcomeExchange owner only.
  //   - Manage Resolver: PredictionMarket owner only.
  const showCreateMarket = isPmOwner || Boolean(pmIsAdmin)
  const showManageAdmins = isPmOwner
  const showManageArbitrators = isOeOwner
  const showManageResolver = isPmOwner
  const showSweep = isPmOwner

  const tabs = useMemo(() => {
    const list: { id: AdminTab; label: string }[] = [
      { id: 'resolve', label: 'Disputes & Resolutions' },
    ]
    if (showCreateMarket) list.push({ id: 'create-market', label: 'Create Market' })
    if (showManageAdmins) list.push({ id: 'manage-admins', label: 'Manage Admins' })
    if (showManageArbitrators) list.push({ id: 'manage-arbitrators', label: 'Manage Arbitrators' })
    if (showManageResolver) list.push({ id: 'manage-resolver', label: 'Manage Resolver' })
    if (showSweep) list.push({ id: 'sweep', label: 'Unclaimed Sweeps' })
    return list
  }, [showCreateMarket, showManageAdmins, showManageArbitrators, showManageResolver, showSweep])

  // If the active tab becomes hidden (e.g. wallet changed), fall back to resolve.
  useEffect(() => {
    if (!tabs.some((t) => t.id === activeTab)) setActiveTab('resolve')
  }, [tabs, activeTab])

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
          <Link href="/" className="font-sans text-sm text-[#B87333] hover:underline">
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
          <Link href="/" className="font-sans text-sm text-[#B87333] hover:underline">
            ← Back to home
          </Link>
          <h1 className="mt-2 font-serif text-3xl font-bold text-[#B87333]">Admin Panel</h1>
        </div>
        <div className="flex items-center gap-3">
          <ConnectWalletButton />
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg border border-[#B87333]/40 px-3 py-2 font-sans text-sm font-semibold text-[#B87333] transition-colors hover:bg-[#B87333]/10"
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
            className={`rounded-full border px-4 py-2 font-sans text-sm font-medium transition-all ${activeTab === tab.id
              ? 'border-[#B87333] bg-[#B87333]/10 text-[#B87333]'
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
          <DisputesResolutions />

          <div className="mt-10 mb-6 border-t border-[#2a2a35] pt-8">
            <h2 className="font-serif text-2xl font-bold text-[#e8e6e3]">Wager Arbitration</h2>
            <p className="mt-2 font-sans text-sm text-[#7c7a76]">
              Wager Market bets in voting or arbitration.
            </p>
          </div>
          <WagerArbitration />

          {/* Maintenance */}
          <div className="mt-10 mb-6 border-t border-[#2a2a35] pt-8">
            <h2 className="font-serif text-2xl font-bold text-[#e8e6e3]">Maintenance</h2>
            <p className="mt-2 font-sans text-sm text-[#7c7a76]">
              Run burn-schedule processing and abandoned-reward sweeps.
            </p>
          </div>
          <div className="space-y-4">
            <ProcessBurnPanel />
            <SweepAbandonedPanel />
          </div>
        </section>
      )}
      {activeTab === 'create-market' && showCreateMarket && (
        <section>
          <div className="mb-6">
            <h2 className="font-serif text-2xl font-bold text-[#e8e6e3]">Create Probability Market</h2>
            <p className="mt-2 font-sans text-sm text-[#7c7a76]">
              Create a new YES/NO binary market for the Probability Shop.
            </p>
          </div>
          <CreateMarketForm />
        </section>
      )}

      {activeTab === 'manage-admins' && showManageAdmins && <ManageAdmins />}

      {activeTab === 'manage-arbitrators' && showManageArbitrators && <ManageArbitrators />}

      {activeTab === 'manage-resolver' && showManageResolver && <ManageResolver />}

      {activeTab === 'sweep' && showSweep && (
        <section>
          <div className="mb-6">
            <h2 className="font-serif text-2xl font-bold text-[#e8e6e3]">Unclaimed Sweeps</h2>
            <p className="mt-2 font-sans text-sm text-[#7c7a76]">
              Sweep forfeited funds from markets resolved over 90 days ago.
            </p>
          </div>
          <SweepPanel />
        </section>
      )}
    </main>
  )
}