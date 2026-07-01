'use client'

import { useState } from 'react'
import { TrendingUp, MoreVertical, Plus, ExternalLink, X } from 'lucide-react'
import { ConnectWalletButton } from './connect-wallet-button'

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

  // Modal states
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [showAddWalletModal, setShowAddWalletModal] = useState(false)
  const [showLoadWalletModal, setShowLoadWalletModal] = useState(false)

  // Add Wallet form state
  const [newWalletName, setNewWalletName] = useState('')
  const [newWalletAddress, setNewWalletAddress] = useState('')
  const [saveWalletList, setSaveWalletList] = useState(false)
  const [walletListName, setWalletListName] = useState('')

  // Load Wallet state
  const [loadWalletName, setLoadWalletName] = useState('')
  const [loadingWallets, setLoadingWallets] = useState(false)

  const handleAddWallet = async () => {
    if (!newWalletName || !newWalletAddress) {
      alert('Please fill in all fields')
      return
    }

    const newWallet: Wallet = {
      id: Math.random().toString(36).substr(2, 9),
      name: newWalletName,
      address: newWalletAddress,
      balance: 0,
      percentage: 0,
      status: 'Active',
    }

    const updatedWallets = [...wallets, newWallet]
    setWallets(updatedWallets)

    // Save wallet list if requested
    if (saveWalletList && walletListName) {
      try {
        await fetch('/api/saved-wallets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: walletListName,
            addresses: updatedWallets.map((w) => w.address),
          }),
        })
      } catch (error) {
        console.error('Error saving wallet list:', error)
      }
    }

    setNewWalletName('')
    setNewWalletAddress('')
    setSaveWalletList(false)
    setWalletListName('')
    setShowAddWalletModal(false)
  }

  const handleLoadWallets = async () => {
    if (!loadWalletName) {
      alert('Please enter a wallet list name')
      return
    }

    setLoadingWallets(true)
    try {
      const response = await fetch(`/api/saved-wallets?name=${encodeURIComponent(loadWalletName)}`)
      if (!response.ok) {
        throw new Error('Wallet list not found')
      }

      const data = await response.json()
      const loadedWallets: Wallet[] = data.addresses.map((address: string, index: number) => ({
        id: Math.random().toString(36).substr(2, 9),
        name: `Wallet ${index + 1}`,
        address,
        balance: 0,
        percentage: 0,
        status: 'Active' as const,
      }))

      setWallets(loadedWallets)
      setLoadWalletName('')
      setShowLoadWalletModal(false)
    } catch (error) {
      console.error('Error loading wallet list:', error)
      alert('Failed to load wallet list. Please check the name and try again.')
    } finally {
      setLoadingWallets(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0a0c] px-4 py-24 md:px-6 md:py-28">
      <div className="mx-auto max-w-7xl">
        {/* Header Section */}
        <div className="mb-12 grid gap-8 md:grid-cols-3">
          <div className="md:col-span-2">
            <h1 className="font-serif text-4xl font-bold text-[#d4af37] md:text-5xl">Portfolio</h1>
            <p className="mt-2 font-sans text-[#b8b6b1]">Track all your assets, stakes, and rewards across multiple wallets.</p>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setShowConnectModal(true)} className="rounded-lg bg-[#d4af37] px-6 py-3 font-sans font-semibold text-[#0a0a0c] transition-colors hover:bg-[#e8c860]">
                Connect Wallet
              </button>
              <button onClick={() => setShowAddWalletModal(true)} className="flex items-center gap-2 rounded-lg border border-[#2a2a35] bg-[#101017] px-6 py-3 font-sans font-semibold text-[#d4af37] transition-colors hover:border-[#d4af37]/50">
                <Plus className="h-4 w-4" />
                Add Wallet
              </button>
              <button onClick={() => setShowLoadWalletModal(true)} className="rounded-lg border border-[#2a2a35] bg-[#101017] px-6 py-3 font-sans font-semibold text-[#d4af37] transition-colors hover:border-[#d4af37]/50">
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

        {/* Connect Wallet Modal */}
        {showConnectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-lg bg-[#101017] p-6 border border-[#2a2a35]">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="font-serif text-xl font-bold text-[#d4af37]">Connect Wallet</h3>
                <button onClick={() => setShowConnectModal(false)} className="text-[#7c7a76] hover:text-[#d4af37]">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="mb-6">
                <ConnectWalletButton fullWidth />
              </div>
              <p className="font-sans text-xs text-center text-[#7c7a76]">
                Connect your wallet to track your portfolio across multiple chains.
              </p>
            </div>
          </div>
        )}

        {/* Add Wallet Modal */}
        {showAddWalletModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-lg bg-[#101017] p-6 border border-[#2a2a35]">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="font-serif text-xl font-bold text-[#d4af37]">Add Wallet</h3>
                <button onClick={() => setShowAddWalletModal(false)} className="text-[#7c7a76] hover:text-[#d4af37]">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block font-sans text-xs font-semibold text-[#7c7a76] mb-2">Wallet Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Main Wallet"
                    value={newWalletName}
                    onChange={(e) => setNewWalletName(e.target.value)}
                    className="w-full rounded-lg border border-[#2a2a35] bg-[#0a0a0c] px-4 py-2 font-sans text-sm text-[#b8b6b1] placeholder-[#7c7a76] focus:border-[#d4af37] outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block font-sans text-xs font-semibold text-[#7c7a76] mb-2">Wallet Address</label>
                  <input
                    type="text"
                    placeholder="0x..."
                    value={newWalletAddress}
                    onChange={(e) => setNewWalletAddress(e.target.value)}
                    className="w-full rounded-lg border border-[#2a2a35] bg-[#0a0a0c] px-4 py-2 font-sans text-sm text-[#b8b6b1] placeholder-[#7c7a76] focus:border-[#d4af37] outline-none transition-colors"
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveWalletList}
                    onChange={(e) => setSaveWalletList(e.target.checked)}
                    className="w-4 h-4 rounded border-[#2a2a35] bg-[#0a0a0c] accent-[#d4af37]"
                  />
                  <span className="font-sans text-xs text-[#7c7a76]">Save wallet list</span>
                </label>
                {saveWalletList && (
                  <div>
                    <label className="block font-sans text-xs font-semibold text-[#7c7a76] mb-2">List Name</label>
                    <input
                      type="text"
                      placeholder="e.g., My Portfolio"
                      value={walletListName}
                      onChange={(e) => setWalletListName(e.target.value)}
                      className="w-full rounded-lg border border-[#2a2a35] bg-[#0a0a0c] px-4 py-2 font-sans text-sm text-[#b8b6b1] placeholder-[#7c7a76] focus:border-[#d4af37] outline-none transition-colors"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddWalletModal(false)}
                  className="flex-1 rounded-lg border border-[#2a2a35] bg-[#0a0a0c] px-4 py-2 font-sans font-semibold text-[#d4af37] transition-colors hover:border-[#d4af37]/50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddWallet}
                  className="flex-1 rounded-lg bg-[#d4af37] px-4 py-2 font-sans font-semibold text-[#0a0a0c] transition-colors hover:bg-[#e8c860]"
                >
                  Add Wallet
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Load Saved Wallet Modal */}
        {showLoadWalletModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-lg bg-[#101017] p-6 border border-[#2a2a35]">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="font-serif text-xl font-bold text-[#d4af37]">Load Saved Wallet</h3>
                <button onClick={() => setShowLoadWalletModal(false)} className="text-[#7c7a76] hover:text-[#d4af37]">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block font-sans text-xs font-semibold text-[#7c7a76] mb-2">Wallet List Name</label>
                  <input
                    type="text"
                    placeholder="e.g., My Portfolio"
                    value={loadWalletName}
                    onChange={(e) => setLoadWalletName(e.target.value)}
                    className="w-full rounded-lg border border-[#2a2a35] bg-[#0a0a0c] px-4 py-2 font-sans text-sm text-[#b8b6b1] placeholder-[#7c7a76] focus:border-[#d4af37] outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowLoadWalletModal(false)}
                  className="flex-1 rounded-lg border border-[#2a2a35] bg-[#0a0a0c] px-4 py-2 font-sans font-semibold text-[#d4af37] transition-colors hover:border-[#d4af37]/50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLoadWallets}
                  disabled={loadingWallets}
                  className="flex-1 rounded-lg bg-[#d4af37] px-4 py-2 font-sans font-semibold text-[#0a0a0c] transition-colors hover:bg-[#e8c860] disabled:opacity-50"
                >
                  {loadingWallets ? 'Loading...' : 'Load'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
