'use client'

import { useState } from 'react'
import { TrendingUp, Trash2, ExternalLink, X } from 'lucide-react'
import { ConnectWalletButton } from './connect-wallet-button'

interface Wallet {
  id: string
  name: string
  address: string
  balance: number
  percentage: number
  selected: boolean
}

interface Asset {
  symbol: string
  name: string
  address: string
  balance: number
  value: number
  change24h: number
}

const TOKEN_CONTRACTS = [
  { symbol: 'OPUS', name: 'Opus', address: '0x9B5a65E37f338ADD1263530DDac8CEc56204bB3a' },
  { symbol: 'CODA', name: 'Coda', address: '0x9F8d74dF6DD3145e858578B0bE1d9B11f41E0A28' },
  { symbol: 'SMAUG', name: 'Smaug', address: '0xf4754Aa585caBf38537A68660469A17E203D8632' },
]

export function PortfolioDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [totalPortfolioValue, setTotalPortfolioValue] = useState(0)
  const [change24h, setChange24h] = useState(0)

  // Modal states
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [showEditWalletsModal, setShowEditWalletsModal] = useState(false)
  const [showLoadWalletModal, setShowLoadWalletModal] = useState(false)

  // Edit wallets state
  const [editingWallets, setEditingWallets] = useState<Wallet[]>([])
  const [newWalletAddress, setNewWalletAddress] = useState('')
  const [newWalletName, setNewWalletName] = useState('')

  // Load Wallet state
  const [loadWalletName, setLoadWalletName] = useState('')
  const [loadingWallets, setLoadingWallets] = useState(false)

  // Populate assets with demo data when wallets are saved
  const handleSaveEditedWallets = () => {
    setWallets(editingWallets)
    setShowEditWalletsModal(false)
    
    // Populate with demo assets
    const demoAssets: Asset[] = [
      { symbol: 'OPUS', name: 'Opus', address: TOKEN_CONTRACTS[0].address, balance: 1240000, value: 62421.20, change24h: 4.21 },
      { symbol: 'CODA', name: 'Coda', address: TOKEN_CONTRACTS[1].address, balance: 810000, value: 41380.35, change24h: 5.18 },
      { symbol: 'SMAUG', name: 'Smaug', address: TOKEN_CONTRACTS[2].address, balance: 55100, value: 47280.15, change24h: 3.72 },
    ]
    setAssets(demoAssets)
  }

  const handleOpenEditModal = () => {
    setEditingWallets(wallets)
    setShowEditWalletsModal(true)
  }

  const handleUpdateWalletName = (id: string, newName: string) => {
    setEditingWallets(editingWallets.map((w) => (w.id === id ? { ...w, name: newName } : w)))
  }

  const handleDeleteWallet = (id: string) => {
    setEditingWallets(editingWallets.filter((w) => w.id !== id))
  }

  const handleToggleWalletSelection = (id: string) => {
    setEditingWallets(
      editingWallets.map((w) => (w.id === id ? { ...w, selected: !w.selected } : w))
    )
  }

  const handleAddNewWallet = () => {
    if (!newWalletAddress) {
      alert('Please enter a wallet address')
      return
    }

    const newWallet: Wallet = {
      id: Math.random().toString(36).substr(2, 9),
      name: newWalletName || 'Wallet',
      address: newWalletAddress,
      balance: 0,
      percentage: 0,
      selected: true,
    }

    setEditingWallets([...editingWallets, newWallet])
    setNewWalletAddress('')
    setNewWalletName('')
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
        selected: true,
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

  const selectedWallets = wallets.filter((w) => w.selected)

  return (
    <main className="min-h-screen bg-[#0a0a0c] px-4 py-24 md:px-6 md:py-28">
      <div className="mx-auto max-w-7xl">
        {/* Header Section */}
        <div className="mb-8 grid gap-8 md:grid-cols-3">
          <div className="md:col-span-2">
            <h1 className="font-serif text-4xl font-bold text-[#d4af37] md:text-5xl">Portfolio</h1>
            <p className="mt-2 font-sans text-[#b8b6b1]">Track all your assets, stakes, and rewards across multiple wallets.</p>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setShowConnectModal(true)} className="rounded-lg bg-[#d4af37] px-6 py-3 font-sans font-semibold text-[#0a0a0c] transition-colors hover:bg-[#e8c860]">
                Connect Wallet
              </button>
              <button onClick={() => handleOpenEditModal()} className="rounded-lg border border-[#2a2a35] bg-[#101017] px-6 py-3 font-sans font-semibold text-[#d4af37] transition-colors hover:border-[#d4af37]/50">
                Edit Wallets
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

        {/* Selected Wallets Chips */}
        {wallets.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
            {selectedWallets.map((wallet) => (
              <div key={wallet.id} className="rounded-lg border border-[#2a2a35] bg-[#101017] px-4 py-2">
                <p className="font-sans text-xs font-semibold text-[#7c7a76]">{wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}</p>
                <p className="font-sans text-xs text-[#b8b6b1]">{wallet.name}</p>
              </div>
            ))}
          </div>
        )}

        {/* Your Wallets Section */}
        <div className="mb-12">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-serif text-xl font-bold text-[#d4af37]">Your Wallets <span className="font-sans text-sm text-[#7c7a76]">{wallets.length}</span></h2>
          </div>
          {wallets.length === 0 ? (
            <div className="rounded-lg border border-[#2a2a35] bg-[#101017] p-8 text-center">
              <p className="font-sans text-[#7c7a76]">No wallets added yet. Connect or add wallets to get started.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {selectedWallets.map((wallet) => (
                <div key={wallet.id} className="rounded-lg border border-[#2a2a35] bg-[#101017] p-4 hover:border-[#d4af37]/30 transition-colors">
                  <div className="mb-3">
                    <h3 className="font-serif font-bold text-[#d4af37]">{wallet.name}</h3>
                  </div>
                  <p className="font-sans text-xs text-[#7c7a76]">{wallet.address}</p>
                  <div className="mt-4 flex items-end justify-between border-t border-[#2a2a35] pt-4">
                    <div>
                      <p className="font-serif text-xl font-bold text-[#d4af37]">${wallet.balance.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
                      <p className="font-sans text-xs text-[#7c7a76]">{wallet.percentage}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Content shown only when wallets are connected */}
        {selectedWallets.length > 0 && (
          <>
            {/* Tabs */}
            <div className="mb-8 border-b border-[#2a2a35]">
              <div className="flex gap-8">
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'assets', label: 'Assets' },
                  { id: 'stakes', label: 'Stakes' },
                  { id: 'rewards', label: 'Rewards' },
                  { id: 'history', label: 'History' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`pb-4 font-sans text-sm font-semibold transition-colors ${
                      activeTab === tab.id
                        ? 'border-b-2 border-[#d4af37] text-[#d4af37]'
                        : 'text-[#7c7a76] hover:text-[#b8b6b1]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'assets' && (
              <div className="mb-12">
                <h3 className="mb-6 font-serif text-xl font-bold text-[#d4af37]">Your Holdings</h3>
                <div className="rounded-lg border border-[#2a2a35] bg-[#101017] overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#2a2a35]">
                        <th className="px-6 py-3 text-left font-sans text-xs font-semibold text-[#7c7a76]">Token</th>
                        <th className="px-6 py-3 text-left font-sans text-xs font-semibold text-[#7c7a76]">Balance</th>
                        <th className="px-6 py-3 text-left font-sans text-xs font-semibold text-[#7c7a76]">Value (USD)</th>
                        <th className="px-6 py-3 text-right font-sans text-xs font-semibold text-[#7c7a76]">24h Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assets.map((asset) => (
                        <tr key={asset.symbol} className="border-b border-[#2a2a35] last:border-b-0 hover:bg-[#0a0a0c] transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-sans font-semibold text-[#b8b6b1]">{asset.name}</p>
                              <p className="font-sans text-xs text-[#7c7a76]">{asset.symbol}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-sans text-sm text-[#b8b6b1]">{asset.balance.toLocaleString()}</td>
                          <td className="px-6 py-4 font-serif font-semibold text-[#d4af37]">${asset.value.toLocaleString('en-US', { maximumFractionDigits: 2 })}</td>
                          <td className="px-6 py-4 text-right">
                            <span className={`font-sans text-sm font-semibold ${asset.change24h >= 0 ? 'text-[#3fbf6f]' : 'text-[#ff6b4a]'}`}>
                              {asset.change24h >= 0 ? '+' : ''}{asset.change24h}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

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
                <ConnectWalletButton />
              </div>
              <p className="font-sans text-xs text-center text-[#7c7a76]">
                Connect your wallet to track your portfolio across multiple chains.
              </p>
            </div>
          </div>
        )}

        {/* Edit Wallets Modal */}
        {showEditWalletsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-2xl rounded-lg bg-[#101017] p-6 border border-[#2a2a35] max-h-[90vh] overflow-y-auto">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="font-serif text-2xl font-bold text-[#d4af37]">Edit Addresses</h3>
                <button onClick={() => setShowEditWalletsModal(false)} className="text-[#7c7a76] hover:text-[#d4af37]">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-6 flex gap-2 border-b border-[#2a2a35] pb-4">
                <button className="rounded-lg bg-[#2a2a35] px-4 py-2 font-sans text-sm font-semibold text-[#d4af37]">
                  {editingWallets.length} Addresses
                </button>
              </div>

              {/* Existing Wallets */}
              <div className="space-y-4 mb-8">
                {editingWallets.map((wallet) => (
                  <div key={wallet.id} className="flex items-center gap-4 rounded-lg border border-[#2a2a35] bg-[#0a0a0c] p-4">
                    <input
                      type="checkbox"
                      checked={wallet.selected}
                      onChange={() => handleToggleWalletSelection(wallet.id)}
                      className="w-5 h-5 rounded border-[#2a2a35] bg-[#0a0a0c] accent-[#d4af37] cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-sans text-sm text-[#b8b6b1] truncate">{wallet.address}</p>
                    </div>
                    <input
                      type="text"
                      value={wallet.name}
                      onChange={(e) => handleUpdateWalletName(wallet.id, e.target.value)}
                      placeholder="Wallet name"
                      className="rounded-lg border border-[#2a2a35] bg-[#0a0a0c] px-3 py-2 font-sans text-sm text-[#b8b6b1] placeholder-[#7c7a76] focus:border-[#d4af37] outline-none transition-colors w-40"
                    />
                    <button
                      onClick={() => handleDeleteWallet(wallet.id)}
                      className="p-2 text-[#7c7a76] hover:text-[#ff6b4a] transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add New Address */}
              <div className="mb-6 border-t border-[#2a2a35] pt-6">
                <p className="mb-4 font-sans text-sm font-semibold text-[#d4af37]">Add new Address</p>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={newWalletAddress}
                    onChange={(e) => setNewWalletAddress(e.target.value)}
                    placeholder="0x..."
                    className="flex-1 rounded-lg border border-[#2a2a35] bg-[#0a0a0c] px-4 py-2 font-sans text-sm text-[#b8b6b1] placeholder-[#7c7a76] focus:border-[#d4af37] outline-none transition-colors"
                  />
                  <input
                    type="text"
                    value={newWalletName}
                    onChange={(e) => setNewWalletName(e.target.value)}
                    placeholder="Wallet name"
                    className="rounded-lg border border-[#2a2a35] bg-[#0a0a0c] px-4 py-2 font-sans text-sm text-[#b8b6b1] placeholder-[#7c7a76] focus:border-[#d4af37] outline-none transition-colors w-40"
                  />
                  <button
                    onClick={handleAddNewWallet}
                    className="rounded-lg bg-[#d4af37] px-4 py-2 font-sans font-semibold text-[#0a0a0c] transition-colors hover:bg-[#e8c860]"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 border-t border-[#2a2a35] pt-6">
                <button
                  onClick={() => setShowEditWalletsModal(false)}
                  className="flex-1 rounded-lg border border-[#2a2a35] bg-[#0a0a0c] px-4 py-2 font-sans font-semibold text-[#d4af37] transition-colors hover:border-[#d4af37]/50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEditedWallets}
                  className="flex-1 rounded-lg bg-[#d4af37] px-4 py-2 font-sans font-semibold text-[#0a0a0c] transition-colors hover:bg-[#e8c860]"
                >
                  Save Wallets
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
