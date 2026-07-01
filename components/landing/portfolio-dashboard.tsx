'use client'

import { useState } from 'react'
import { TrendingUp, MoreVertical, Plus, ExternalLink } from 'lucide-react'

interface Wallet {
  id: string
  name: string
  address: string
  balance: number
  percentage: number
  status: 'Active' | 'Inactive'
}

export function PortfolioDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [totalPortfolioValue, setTotalPortfolioValue] = useState(0)
  const [change24h, setChange24h] = useState(0)

  return (
    <main className="min-h-screen bg-[#0a0a0c] px-4 py-24 md:px-6 md:py-28">
      <div className="mx-auto max-w-7xl">
        {/* Header Section */}
        <div className="mb-12 grid gap-8 md:grid-cols-3">
          <div className="md:col-span-2">
            <h1 className="font-serif text-4xl font-bold text-[#d4af37] md:text-5xl">Portfolio</h1>
            <p className="mt-2 font-sans text-[#b8b6b1]">Track all your assets, stakes, and rewards across multiple wallets.</p>
            <div className="mt-6 flex gap-3">
              <button className="rounded-lg bg-[#d4af37] px-6 py-3 font-sans font-semibold text-[#0a0a0c] transition-colors hover:bg-[#e8c860]">
                Connect Wallet
              </button>
              <button className="flex items-center gap-2 rounded-lg border border-[#2a2a35] bg-[#101017] px-6 py-3 font-sans font-semibold text-[#d4af37] transition-colors hover:border-[#d4af37]/50">
                <Plus className="h-4 w-4" />
                Add Wallet
              </button>
              <button className="rounded-lg border border-[#2a2a35] bg-[#101017] px-6 py-3 font-sans font-semibold text-[#d4af37] transition-colors hover:border-[#d4af37]/50">
                Load Saved Wallet
              </button>
            </div>
          </div>

          {/* Total Portfolio Value Card */}
          <div className="rounded-lg border border-[#2a2a35] bg-[#101017] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-sans text-xs font-semibold text-[#7c7a76]">Total Portfolio Value</p>
                <p className="mt-3 font-serif text-3xl font-bold text-[#d4af37]">
                  ${totalPortfolioValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                </p>
                <p className="mt-2 font-sans text-xs font-semibold text-[#3fbf6f]">{change24h > 0 ? '+' : ''}{change24h}% (24h)</p>
              </div>
              <TrendingUp className="h-12 w-12 text-[#d4af37]" />
            </div>
          </div>
        </div>

        {/* Your Wallets Section */}
        <div className="mb-12">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-serif text-xl font-bold text-[#d4af37]">Your Wallets <span className="font-sans text-sm text-[#7c7a76]">{wallets.length}</span></h2>
          </div>
          {wallets.length === 0 ? (
            <div className="rounded-lg border border-[#2a2a35] bg-[#101017] p-8 text-center">
              <p className="font-sans text-[#7c7a76]">No wallets connected yet. Connect a wallet to get started.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {wallets.map((wallet) => (
                <div key={wallet.id} className="rounded-lg border-2 border-[#2a2a35] bg-[#101017] p-4 hover:border-[#d4af37]/30 transition-colors">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">⭐</span>
                      <h3 className="font-serif font-bold text-[#d4af37]">{wallet.name}</h3>
                    </div>
                    <button className="text-[#7c7a76] hover:text-[#d4af37] transition-colors">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="font-sans text-xs text-[#7c7a76]">{wallet.address}</p>
                  <div className="mt-4 flex items-end justify-between border-t border-[#2a2a35] pt-4">
                    <div>
                      <p className="font-serif text-xl font-bold text-[#d4af37]">${wallet.balance.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
                      <p className="font-sans text-xs text-[#7c7a76]">{wallet.percentage}%</p>
                    </div>
                    <span className="rounded-full bg-[#3fbf6f]/10 px-2 py-1 font-sans text-xs font-semibold text-[#3fbf6f]">{wallet.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Content shown only when wallets are connected */}
        {wallets.length > 0 && (
          <>
            {/* Tabs */}
            <div className="mb-8 border-b border-[#2a2a35]">
              <div className="flex gap-8">
                {[
                  { id: 'overview', label: 'Overview', icon: '📊' },
                  { id: 'assets', label: 'Assets', icon: '💎' },
                  { id: 'stakes', label: 'Stakes', icon: '🔒' },
                  { id: 'rewards', label: 'Rewards', icon: '🎁' },
                  { id: 'history', label: 'History', icon: '📜' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`pb-4 font-sans text-sm font-semibold transition-colors flex items-center gap-2 ${
                      activeTab === tab.id
                        ? 'border-b-2 border-[#d4af37] text-[#d4af37]'
                        : 'text-[#7c7a76] hover:text-[#b8b6b1]'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Portfolio Overview Metrics */}
            <div className="mb-12">
              <h3 className="mb-6 font-serif text-xl font-bold text-[#d4af37]">Portfolio Overview</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border border-[#2a2a35] bg-[#101017] p-4">
                  <p className="font-sans text-xs font-semibold text-[#7c7a76]">Total Assets</p>
                  <p className="mt-2 font-serif font-bold text-[#d4af37]">${totalPortfolioValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
                  <p className="mt-1 font-sans text-xs font-semibold text-[#3fbf6f]">{change24h > 0 ? '+' : ''}{change24h}% (24h)</p>
                </div>
                <div className="rounded-lg border border-[#2a2a35] bg-[#101017] p-4">
                  <p className="font-sans text-xs font-semibold text-[#7c7a76]">Total Rewards (All Time)</p>
                  <p className="mt-2 font-serif font-bold text-[#d4af37]">-- PLS</p>
                  <p className="mt-1 font-sans text-xs text-[#7c7a76]">-- PLSX</p>
                </div>
                <div className="rounded-lg border border-[#2a2a35] bg-[#101017] p-4">
                  <p className="font-sans text-xs font-semibold text-[#7c7a76]">Total Staked (Smaug)</p>
                  <p className="mt-2 font-serif font-bold text-[#d4af37]">-- SMAUG</p>
                  <p className="mt-1 font-sans text-xs text-[#7c7a76]">-- active stakes</p>
                </div>
                <div className="rounded-lg border border-[#2a2a35] bg-[#101017] p-4">
                  <p className="font-sans text-xs font-semibold text-[#7c7a76]">Referrals Earned</p>
                  <p className="mt-2 font-serif font-bold text-[#d4af37]">-- OATH</p>
                  <p className="mt-1 font-sans text-xs text-[#7c7a76]">-- (24h)</p>
                </div>
              </div>
            </div>

            {/* Asset Allocation & Holdings */}
            <div className="mb-12 grid gap-8 lg:grid-cols-2">
              {/* Asset Allocation */}
              <div className="rounded-lg border border-[#2a2a35] bg-[#101017] p-6">
                <h3 className="mb-6 font-serif text-lg font-bold text-[#d4af37]">Asset Allocation</h3>
                <div className="text-center py-12">
                  <p className="font-sans text-[#7c7a76]">Loading assets...</p>
                </div>
                <button className="mt-6 flex items-center gap-2 font-sans text-sm font-semibold text-[#d4af37] transition-colors hover:text-[#e8c860]">
                  View all assets <TrendingUp className="h-4 w-4" />
                </button>
              </div>

              {/* Holdings by Token */}
              <div className="rounded-lg border border-[#2a2a35] bg-[#101017] p-6">
                <h3 className="mb-6 font-serif text-lg font-bold text-[#d4af37]">Holdings by Token</h3>
                <div className="text-center py-12">
                  <p className="font-sans text-[#7c7a76]">Loading holdings...</p>
                </div>
                <button className="mt-6 flex items-center gap-2 font-sans text-sm font-semibold text-[#d4af37] transition-colors hover:text-[#e8c860]">
                  View all assets <TrendingUp className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <div className="mb-6 flex items-center justify-between">
                <h3 className="font-serif text-xl font-bold text-[#d4af37]">Recent Activity Across All Wallets</h3>
                <button className="flex items-center gap-2 font-sans text-sm font-semibold text-[#d4af37] transition-colors hover:text-[#e8c860]">
                  View full history <ExternalLink className="h-4 w-4" />
                </button>
              </div>
              <div className="rounded-lg border border-[#2a2a35] bg-[#101017] p-6">
                <div className="text-center py-8">
                  <p className="font-sans text-[#7c7a76]">No recent activity</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
