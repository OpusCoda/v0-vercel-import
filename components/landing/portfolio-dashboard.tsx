'use client'
import { useState, useEffect } from 'react'
import { Trash2, X } from 'lucide-react'
import { ConnectWalletButton } from './connect-wallet-button'
import { ethers } from 'ethers'
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
  { symbol: 'OPUS', name: 'Opus', address: '0x9B5a65E37f338ADD1263530DDac8CEc56204bB3a', decimals: 18 },
  { symbol: 'CODA', name: 'Coda', address: '0x9F8d74dF6DD3145e858578B0bE1d9B11f41E0A28', decimals: 18 },
  { symbol: 'SMAUG', name: 'Smaug', address: '0xf4754Aa585caBf38537A68660469A17E203D8632', decimals: 18 },
  { symbol: 'PRVX', name: 'Privex', address: '0x7f681a5ad615238357ba148c281e2eaefd2de55a', decimals: 18 },
  { symbol: 'PLS', name: 'Pulse', address: 'native', decimals: 18 },
  { symbol: 'PLSX', name: 'PulseX', address: '0x95B303987A60C71504D99Aa1b13B4DA07b0790ab', decimals: 18 },
  { symbol: 'INC', name: 'Incentive', address: '0x2fa878Ab3F87CC1C9737Fc071108F904c0B0C95d', decimals: 18 },
  { symbol: 'HEX', name: 'HEX', address: '0x2b591e99afe9f32eaa6214f7b7629768c40eeb39', decimals: 8 },
  { symbol: 'eHEX', name: 'eHEX (Ethereum)', address: '0x57fde0a71132198BBeC939B98976993d8D89D225', decimals: 8 },
  { symbol: 'WETH', name: 'WETH', address: '0x02DcdD04e3F455D838cd1249292C58f3B79e3C3C', decimals: 18 },
  { symbol: 'WBTC', name: 'Wrapped Bitcoin', address: '0xb17D901469B9208B17d916112988A3FeD19b5cA1', decimals: 8 },
  { symbol: 'eBTC', name: 'eBTC (WBTC from Ethereum)', address: '0xb17D901469B9208B17d916112988A3FeD19b5cA1', decimals: 8 },
]
const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
]
const PULSECHAIN_RPC_URL = 'https://rpc.pulsechain.com'
// Token prices from DexScreener and market data
const fetchTokenPrices = async (): Promise<{ [key: string]: number }> => {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=pulsechain,pulsex,hex,ethereum,bitcoin&vs_currencies=usd'
    )
    const data = await response.json()
    return {
      PLS: data.pulsechain?.usd || 0.000006246,
      PLSX: data.pulsex?.usd || 0.055490,
      HEX: data.hex?.usd || 0.001344,
      eHEX: 0.0006348,
      OPUS: 0.0004037,
      CODA: 0.0004,
      SMAUG: 0.0002213,
      PRVX: 0.00000001,
      INC: 0.30,
      WETH: data.ethereum?.usd || 2500,
      WBTC: data.bitcoin?.usd || 45000,
      eBTC: data.bitcoin?.usd || 45000,
    }
  } catch (error) {
    console.error('Error fetching prices:', error)
    return {
      OPUS: 0.0004037,
      CODA: 0.0004,
      SMAUG: 0.0002213,
      PRVX: 0.00000001,
      PLS: 0.000006246,
      PLSX: 0.055490,
      HEX: 0.001344,
      eHEX: 0.0006348,
      INC: 0.30,
      WETH: 2500,
      WBTC: 45000,
      eBTC: 45000,
    }
  }
}
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
  const [loadedWalletListName, setLoadedWalletListName] = useState<string | null>(null)
  // Fetch token balances for wallets
  const fetchTokenBalances = async (addresses: string[]) => {
    try {
      const provider = new ethers.JsonRpcProvider(PULSECHAIN_RPC_URL)
      const prices = await fetchTokenPrices()
      
      // Aggregate balances by token across all wallets
      const tokenBalances: { [symbol: string]: { balance: number; token: typeof TOKEN_CONTRACTS[0] } } = {}
      for (const token of TOKEN_CONTRACTS) {
        let totalBalance = 0
        
        if (token.symbol === 'PLS') {
          // Handle native PLS separately
          for (const address of addresses) {
            const balance = await provider.getBalance(address)
            totalBalance += Number(ethers.formatUnits(balance, 18))
          }
        } else {
          const tokenContract = new ethers.Contract(token.address, ERC20_ABI, provider)
          for (const address of addresses) {
            const balance = await tokenContract.balanceOf(address)
            totalBalance += Number(ethers.formatUnits(balance, token.decimals))
          }
        }
        
        if (totalBalance > 0) {
          tokenBalances[token.symbol] = { balance: totalBalance, token }
        }
      }
      // Convert to assets and filter by balance > 0 and value > 0
      const fetchedAssets: Asset[] = Object.entries(tokenBalances)
        .map(([symbol, { balance, token }]) => {
          const price = prices[symbol] || 0
          const value = balance * price
          return {
            symbol,
            name: token.name,
            address: token.address,
            balance,
            value,
            change24h: 0,
          }
        })
        .filter(asset => asset.balance > 0 && asset.value > 0)
        .sort((a, b) => b.value - a.value)
      setAssets(fetchedAssets)
      console.log('[v0] Fetched', fetchedAssets.length, 'assets for', addresses.length, 'wallets')
    } catch (error) {
      console.error('[v0] Error fetching token balances:', error)
      setAssets([])
    }
  }
  // Save edited wallets and fetch real data
  const handleSaveEditedWallets = async () => {
    console.log('[v0] handleSaveEditedWallets called with', editingWallets.length, 'wallets')
    console.log('[v0] editingWallets:', editingWallets)
    
    // Save wallet list locally and to API if it was loaded from a saved list
    if (loadedWalletListName) {
      try {
        const walletsData = editingWallets.map(w => ({
          address: w.address,
          name: w.name,
          selected: w.selected
        }))
        // Save to localStorage for quick retrieval
        localStorage.setItem('currentWalletList', JSON.stringify({ name: loadedWalletListName, wallets: editingWallets }))
        // Also send updated wallets to API to persist changes
        await fetch(`/api/saved-wallets`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: loadedWalletListName, wallets: walletsData })
        })
      } catch (error) {
        console.error('Error saving wallets:', error)
      }
    }
    // Update state with edited wallets - this will trigger the useEffect to fetch data
    console.log('[v0] Calling setWallets with', editingWallets.length, 'wallets')
    setWallets(editingWallets)
    setShowEditWalletsModal(false)
    const selectedAddresses = editingWallets.filter(w => w.selected).map(w => w.address)
    if (selectedAddresses.length > 0) {
      fetchTokenBalances(selectedAddresses)
    } else {
      setAssets([])
    }
  }
  const handleOpenEditModal = () => {
    // Auto-select all wallets when opening Edit modal for convenience (only if wallets exist)
    if (wallets.length > 0) {
      const selectedWallets = wallets.map(w => ({ ...w, selected: true }))
      setEditingWallets(selectedWallets)
    } else {
      setEditingWallets([])
    }
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
    // Validate wallet address format
    if (!ethers.isAddress(newWalletAddress)) {
      alert('Invalid wallet address format')
      return
    }
    const newWallet: Wallet = {
      id: Math.random().toString(36).substr(2, 9),
      name: newWalletName || 'Wallet',
      address: ethers.getAddress(newWalletAddress), // Normalize address to checksum format
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
      setLoadedWalletListName(loadWalletName)
      setLoadWalletName('')
      setShowLoadWalletModal(false)
      
      // Save to localStorage for quick restoration
      localStorage.setItem('currentWalletList', JSON.stringify({ name: loadWalletName, wallets: loadedWallets }))
      
      // Fetch real data for loaded wallets
      const selectedAddresses = loadedWallets.map(w => w.address)
      fetchTokenBalances(selectedAddresses)
    } catch (error) {
      console.error('Error loading wallet list:', error)
      alert('Failed to load wallet list. Please check the name and try again.')
    } finally {
      setLoadingWallets(false)
    }
  }
  const selectedWallets = wallets.filter((w) => w.selected)
  // Calculate total portfolio value from assets
  useEffect(() => {
    if (assets.length > 0) {
      const total = assets.reduce((sum, asset) => sum + asset.value, 0)
      const avgChange = assets.reduce((sum, asset) => sum + asset.change24h, 0) / assets.length
      setTotalPortfolioValue(total)
      setChange24h(Math.round(avgChange * 100) / 100)
    }
  }, [assets])
  // Load wallets from localStorage on mount
  useEffect(() => {
    const savedWallets = localStorage.getItem('currentWalletList')
    if (savedWallets) {
      try {
        const parsed = JSON.parse(savedWallets)
        setWallets(parsed.wallets)
        setLoadedWalletListName(parsed.name)
      } catch (e) {
        console.error('Error loading saved wallets:', e)
      }
    }
  }, [])
  // Fetch data when selected wallets change
  useEffect(() => {
    const selectedAddresses = wallets.filter(w => w.selected).map(w => w.address)
    console.log('[v0] Wallets changed, selected:', selectedAddresses.length, 'wallets')
    if (selectedAddresses.length > 0) {
      console.log('[v0] Fetching portfolio data')
      fetchTokenBalances(selectedAddresses)
    } else {
      console.log('[v0] No selected wallets, clearing data')
      setAssets([])
    }
  }, [wallets])
  return (
    <main className="min-h-screen bg-[#0b0b0e] px-6 py-12 md:px-8 md:py-16">
      <div className="mx-auto max-w-7xl">
        {/* Header with Title and Stats */}
        <div className="mb-16">
          <div className="flex items-end justify-between mb-8">
            <h1 className="font-serif text-5xl font-bold text-[#f4f4f4]">Portfolio dashboard</h1>
            
            {/* Total Portfolio Value - Positioned to the right */}
            {wallets.length > 0 && (
              <div className="text-right">
                <p className="font-sans text-xs font-medium text-[#9a9a9a] mb-1">Total Portfolio Value</p>
                <p className="font-serif text-3xl font-bold text-[#f4f4f4]">${totalPortfolioValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
              </div>
            )}
          </div>
          {/* Action Buttons */}
          <div className="flex gap-4">
            <button onClick={() => setShowConnectModal(true)} className="bg-[#d8b13d] text-[#0b0b0e] px-6 py-2.5 rounded font-sans font-semibold text-sm hover:bg-[#e8c860] transition-colors">
              Connect Wallet
            </button>
            <button onClick={() => handleOpenEditModal()} className="border border-[#d8b13d] text-[#d8b13d] px-6 py-2.5 rounded font-sans font-semibold text-sm hover:bg-[#d8b13d]/5 transition-colors">
              {wallets.length > 0 ? 'Edit Wallets' : 'Add Wallet'}
            </button>
            <button onClick={() => setShowLoadWalletModal(true)} className="border border-[#d8b13d] text-[#d8b13d] px-6 py-2.5 rounded font-sans font-semibold text-sm hover:bg-[#d8b13d]/5 transition-colors">
              Load Saved Wallet
            </button>
          </div>
        </div>
        {/* Your Wallets Section */}
        {wallets.length > 0 && (
          <div className="mb-16 pb-12 border-b border-[rgba(255,255,255,0.08)]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-2xl font-bold text-[#f4f4f4]">Your Wallets <span className="text-[#d8b13d]">({selectedWallets.length} selected)</span></h2>
              <div className="flex gap-2">
                <button onClick={() => {
                  const allSelected = wallets.every(w => w.selected)
                  if (allSelected) {
                    setWallets(wallets.map(w => ({ ...w, selected: false })))
                  } else {
                    setWallets(wallets.map(w => ({ ...w, selected: true })))
                  }
                }} className="font-sans text-sm text-[#d8b13d] hover:text-[#e8c860]">
                  {wallets.every(w => w.selected) ? 'Deselect All' : 'Select All'}
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {wallets.map((wallet) => (
                <button
                  key={wallet.id}
                  onClick={() => {
                    const updated = wallets.map(w => 
                      w.id === wallet.id ? { ...w, selected: !w.selected } : w
                    )
                    setWallets(updated)
                  }}
                  className="flex items-center gap-3 border border-[rgba(255,255,255,0.08)] rounded-lg px-4 py-3 bg-[#121218] hover:border-[#3b82f6]/50 transition-all text-left group"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <div className={`w-2 h-2 rounded-full ${wallet.selected ? 'bg-[#3b82f6]' : 'bg-[#3a3a40]'}`}></div>
                    <div>
                      <p className="font-sans font-semibold text-[#f4f4f4] text-sm">{wallet.name}</p>
                      <p className="font-sans text-xs text-[#9a9a9a]">{wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      const textarea = document.createElement('textarea')
                      textarea.value = wallet.address
                      document.body.appendChild(textarea)
                      textarea.select()
                      document.execCommand('copy')
                      document.body.removeChild(textarea)
                    }}
                    className="ml-2 p-1 rounded hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                    title="Copy address"
                  >
                    <svg className="w-4 h-4 text-[#9a9a9a] hover:text-[#f4f4f4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </button>
              ))}
            </div>
          </div>
        )}
        {/* Content shown only when wallets are connected */}
        {selectedWallets.length > 0 && (
          <>
            {/* Tabs */}
            <div className="mb-8 border-b border-[#2a2a35]">
              <div className="flex gap-8">
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'assets', label: 'Assets' },
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
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="mb-12">
                <h3 className="font-serif text-xl font-bold text-[#f4f4f4] mb-6">Holdings</h3>
                <div className="space-y-2">
                  {assets.filter(a => a.value > 0.5).slice(0, 10).map((asset) => (
                    <div key={asset.symbol} className="flex justify-between items-center py-3 px-4 rounded hover:bg-[rgba(255,255,255,0.02)]">
                      <div>
                        <p className="font-sans text-sm font-medium text-[#f4f4f4]">{asset.symbol}</p>
                        <p className="font-sans text-xs text-[#9a9a9a]">{Number(asset.balance).toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                      </div>
                      <p className="font-sans font-semibold text-[#d8b13d]">${asset.value.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
                    </div>
                  ))}
                  {assets.filter(a => a.value > 0.5).length > 10 && (
                    <p className="font-sans text-xs text-[#9a9a9a] text-center py-3">+{assets.filter(a => a.value > 0.5).length - 10} more tokens</p>
                  )}
                </div>
              </div>
            )}
            {/* Assets Tab */}
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
                        <th className="px-6 py-3 text-right font-sans text-xs font-semibold text-[#7c7a76]">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assets.filter(a => a.value > 0.5).map((asset) => {
                        const price = asset.balance > 0 ? asset.value / asset.balance : 0
                        return (
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
                            <span className="font-sans text-sm font-semibold text-[#d4af37]">
                              ${price.toLocaleString('en-US', { maximumFractionDigits: price < 0.01 ? 8 : 4 })}
                            </span>
                          </td>
                        </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
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
                  {loadedWalletListName ? 'Save Changes' : 'Save Wallets'}
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
