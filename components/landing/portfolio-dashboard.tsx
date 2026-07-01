'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Trash2, ExternalLink, X, ChevronDown } from 'lucide-react'
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

interface HexStake {
  stakeId: string
  stakedHearts: string
  stakeShares: string
  lockedDay: number
  stakedDays: number
  unlockedDay: number
  isAutoStake: boolean
  daysPassed: number
  daysRemaining: number
  isActive: boolean
  wallet: string
  chain: string
}

interface LiquidLoan {
  wallet: string
  lockedPLS: number
  debt: number
}

const TOKEN_CONTRACTS = [
  { symbol: 'OPUS', name: 'Opus', address: '0x9B5a65E37f338ADD1263530DDac8CEc56204bB3a', decimals: 18 },
  { symbol: 'CODA', name: 'Coda', address: '0x9F8d74dF6DD3145e858578B0bE1d9B11f41E0A28', decimals: 18 },
  { symbol: 'SMAUG', name: 'Smaug', address: '0xf4754Aa585caBf38537A68660469A17E203D8632', decimals: 18 },
  { symbol: 'PLS', name: 'Pulse', address: 'native', decimals: 18 },
  { symbol: 'PLSX', name: 'PulseX', address: '0x95B303987A60C71504D99Aa1b13B4DA07b0790ab', decimals: 18 },
  { symbol: 'INC', name: 'Incentive', address: '0x2fa2c892376ecc53b06b6ac850a177bd86b04c10', decimals: 18 },
  { symbol: 'HEX', name: 'HEX', address: '0x2b591e99afe9f32eaa6214f7b7629768c40eeb39', decimals: 8 },
]

const HEX_PULSECHAIN_ADDRESS = '0x2b591e99afe9f32eaa6214f7b7629768c40eeb39'
const HSI_MANAGER_ADDRESS = '0x8bd3d1472a656e312e94fb1bbdd599b8c51d18e3'
const LIQUID_LOANS_VAULT_MANAGER = '0xD79bfb86fA06e8782b401bC0197d92563602D2Ab'

const HEX_STAKING_ABI = [
  'function stakeCount(address) view returns (uint256)',
  'function stakeLists(address, uint256) view returns (uint40 stakeId, uint72 stakedHearts, uint72 stakeShares, uint16 lockedDay, uint16 stakedDays, uint16 unlockedDay, bool isAutoStake)',
  'function currentDay() view returns (uint256)',
]

const LIQUID_LOANS_ABI = [
  'function getVaultColl(address) view returns (uint256)',
  'function getVaultDebt(address) view returns (uint256)',
]

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
]

const PULSECHAIN_RPC_URL = 'https://rpc.pulsechain.com'

// Coingecko API for fetching token prices
const fetchTokenPrices = async (): Promise<{ [key: string]: number }> => {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=pulsechain,pulsex,hex&vs_currencies=usd'
    )
    const data = await response.json()
    return {
      PLS: data.pulsechain?.usd || 0,
      PLSX: data.pulsex?.usd || 0,
      HEX: data.hex?.usd || 0,
      OPUS: 0.05, // Fallback prices
      CODA: 0.051,
      SMAUG: 0.857,
      INC: 0.01,
    }
  } catch (error) {
    console.error('Error fetching prices:', error)
    return {
      OPUS: 0.05,
      CODA: 0.051,
      SMAUG: 0.857,
      PLS: 0.08,
      PLSX: 0.05,
      HEX: 0.04,
      INC: 0.01,
    }
  }
}

export function PortfolioDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [hexStakes, setHexStakes] = useState<HexStake[]>([])
  const [hsiStakes, setHsiStakes] = useState<HexStake[]>([])
  const [liquidLoans, setLiquidLoans] = useState<LiquidLoan[]>([])
  const [totalPortfolioValue, setTotalPortfolioValue] = useState(0)
  const [change24h, setChange24h] = useState(0)
  const [expandedStakes, setExpandedStakes] = useState<Set<string>>(new Set())

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

      // Convert to assets and filter by minimum value of $1
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
        .filter(asset => asset.value >= 1)
        .sort((a, b) => b.value - a.value)

      setAssets(fetchedAssets)
    } catch (error) {
      console.error('Error fetching token balances:', error)
    }
  }

  // Fetch HEX stakes for wallets
  const fetchHexStakes = async (addresses: string[]) => {
    try {
      const provider = new ethers.JsonRpcProvider(PULSECHAIN_RPC_URL)
      const hexContract = new ethers.Contract(HEX_PULSECHAIN_ADDRESS, HEX_STAKING_ABI, provider)
      const hsiContract = new ethers.Contract(HSI_MANAGER_ADDRESS, HEX_STAKING_ABI, provider)

      const currentDay = await hexContract.currentDay()
      const allHexStakes: HexStake[] = []
      const allHsiStakes: HexStake[] = []

      for (const address of addresses) {
        // Fetch HEX stakes
        const hexStakeCount = await hexContract.stakeCount(address)
        for (let i = 0; i < Number(hexStakeCount); i++) {
          const stake = await hexContract.stakeLists(address, i)
          const daysPassed = Number(currentDay) - Number(stake.lockedDay)
          const daysRemaining = Number(stake.stakedDays) - daysPassed
          const isActive = Number(stake.unlockedDay) === 0
          allHexStakes.push({
            stakeId: stake.stakeId.toString(),
            stakedHearts: ethers.formatUnits(stake.stakedHearts, 8),
            stakeShares: ethers.formatUnits(stake.stakeShares, 12),
            lockedDay: Number(stake.lockedDay),
            stakedDays: Number(stake.stakedDays),
            unlockedDay: Number(stake.unlockedDay),
            isAutoStake: stake.isAutoStake,
            daysPassed: Math.max(0, daysPassed),
            daysRemaining: Math.max(0, daysRemaining),
            isActive,
            wallet: address,
            chain: 'Pulsechain',
          })
        }

        // Fetch HSI stakes
        const hsiStakeCount = await hsiContract.stakeCount(address)
        for (let i = 0; i < Number(hsiStakeCount); i++) {
          const stake = await hsiContract.stakeLists(address, i)
          const daysPassed = Number(currentDay) - Number(stake.lockedDay)
          const daysRemaining = Number(stake.stakedDays) - daysPassed
          const isActive = Number(stake.unlockedDay) === 0
          allHsiStakes.push({
            stakeId: stake.stakeId.toString(),
            stakedHearts: ethers.formatUnits(stake.stakedHearts, 8),
            stakeShares: ethers.formatUnits(stake.stakeShares, 12),
            lockedDay: Number(stake.lockedDay),
            stakedDays: Number(stake.stakedDays),
            unlockedDay: Number(stake.unlockedDay),
            isAutoStake: stake.isAutoStake,
            daysPassed: Math.max(0, daysPassed),
            daysRemaining: Math.max(0, daysRemaining),
            isActive,
            wallet: address,
            chain: 'Pulsechain',
          })
        }
      }

      setHexStakes(allHexStakes)
      setHsiStakes(allHsiStakes)
    } catch (error) {
      console.error('Error fetching HEX stakes:', error)
    }
  }

  // Fetch Liquid Loans positions
  const fetchLiquidLoans = async (addresses: string[]) => {
    try {
      const provider = new ethers.JsonRpcProvider(PULSECHAIN_RPC_URL)
      const vaultManager = new ethers.Contract(LIQUID_LOANS_VAULT_MANAGER, LIQUID_LOANS_ABI, provider)
      const loans: LiquidLoan[] = []

      for (const address of addresses) {
        const coll = await vaultManager.getVaultColl(address)
        const debt = await vaultManager.getVaultDebt(address)

        if (coll > 0n || debt > 0n) {
          loans.push({
            wallet: address,
            lockedPLS: Number(ethers.formatUnits(coll, 18)),
            debt: Number(ethers.formatUnits(debt, 18)),
          })
        }
      }

      setLiquidLoans(loans)
    } catch (error) {
      console.error('Error fetching Liquid Loans:', error)
    }
  }

  // Save edited wallets and fetch real data
  const handleSaveEditedWallets = () => {
    setWallets(editingWallets)
    setShowEditWalletsModal(false)

    // Fetch real data for selected wallets
    const selectedAddresses = editingWallets.filter(w => w.selected).map(w => w.address)
    if (selectedAddresses.length > 0) {
      fetchTokenBalances(selectedAddresses)
      fetchHexStakes(selectedAddresses)
      fetchLiquidLoans(selectedAddresses)
    } else {
      setAssets([])
      setHexStakes([])
      setHsiStakes([])
      setLiquidLoans([])
    }
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
      
      // Fetch real data for loaded wallets
      const selectedAddresses = loadedWallets.map(w => w.address)
      fetchTokenBalances(selectedAddresses)
      fetchHexStakes(selectedAddresses)
      fetchLiquidLoans(selectedAddresses)
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



  return (
    <main className="min-h-screen bg-[#0a0a0c] px-4 py-24 md:px-6 md:py-28">
      <div className="mx-auto max-w-7xl">
        {/* Header Section */}
        <div className="mb-8 grid gap-8 md:grid-cols-3">
          <div className="md:col-span-2">
            <h1 className="font-serif text-4xl font-bold text-[#d4af37] md:text-5xl">Portfolio</h1>
            <p className="mt-2 font-sans text-[#b8b6b1]">See what your wallets hold.</p>
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



        {/* Content shown only when wallets are connected */}
        {selectedWallets.length > 0 && (
          <>
            {/* Tabs */}
            <div className="mb-8 border-b border-[#2a2a35]">
              <div className="flex gap-8">
                {[
                  { id: 'overview', label: 'Overview', show: true },
                  { id: 'assets', label: 'Assets', show: true },
                  { id: 'hexstakes', label: 'HEX Stakes', show: hexStakes.length > 0 },
                  { id: 'hsistakes', label: 'HSI Stakes', show: hsiStakes.length > 0 },
                  { id: 'liquidloans', label: 'Liquid Loans positions', show: liquidLoans.length > 0 },
                ].filter(tab => tab.show).map((tab) => (
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
                <h3 className="mb-6 font-serif text-xl font-bold text-[#d4af37]">Portfolio Overview</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg border border-[#2a2a35] bg-[#101017] p-4">
                    <p className="font-sans text-xs font-semibold text-[#7c7a76]">Total Assets</p>
                    <p className="mt-2 font-serif font-bold text-[#d4af37]">${totalPortfolioValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
                    <p className="mt-1 font-sans text-xs font-semibold text-[#3fbf6f]">{change24h > 0 ? '+' : ''}{change24h}% (24h)</p>
                  </div>
                  <div className="rounded-lg border border-[#2a2a35] bg-[#101017] p-4">
                    <p className="font-sans text-xs font-semibold text-[#7c7a76]">Selected Wallets</p>
                    <p className="mt-2 font-serif font-bold text-[#d4af37]">{selectedWallets.length}</p>
                  </div>
                  <div className="rounded-lg border border-[#2a2a35] bg-[#101017] p-4">
                    <p className="font-sans text-xs font-semibold text-[#7c7a76]">Tokens Held</p>
                    <p className="mt-2 font-serif font-bold text-[#d4af37]">{assets.length}</p>
                  </div>
                  <div className="rounded-lg border border-[#2a2a35] bg-[#101017] p-4">
                    <p className="font-sans text-xs font-semibold text-[#7c7a76]">HEX Stakes</p>
                    <p className="mt-2 font-serif font-bold text-[#d4af37]">{hexStakes.length}</p>
                  </div>
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

            {/* HEX Stakes Tab */}
            {activeTab === 'hexstakes' && hexStakes.length > 0 && (
              <div className="mb-12">
                <div className="mb-6">
                  <h3 className="font-serif text-xl font-bold text-[#d4af37]">HEX Stakes</h3>
                  <p className="font-sans text-sm text-[#7c7a76] mt-1">{hexStakes.length} stake{hexStakes.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="space-y-2">
                  {hexStakes.map((stake) => (
                    <div key={`${stake.wallet}-${stake.stakeId}`} className={`rounded-lg border px-4 py-3 font-sans text-sm font-medium ${stake.isActive ? 'border-[#2a2a35] bg-[#101017] text-green-400' : 'border-[#2a2a35] bg-[#0a0a0c] text-slate-400'}`}>
                      Day {stake.daysPassed}/{stake.stakedDays} ({stake.daysRemaining} days left) — {Number(stake.stakedHearts).toLocaleString(undefined, { maximumFractionDigits: 0 })} HEX — {Number(stake.stakeShares).toLocaleString(undefined, { maximumFractionDigits: 2 })} T-shares{stake.isAutoStake ? ' (Auto)' : ''} — {stake.wallet.slice(0, 4)}…{stake.wallet.slice(-4)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* HSI Stakes Tab */}
            {activeTab === 'hsistakes' && hsiStakes.length > 0 && (
              <div className="mb-12">
                <div className="mb-6">
                  <h3 className="font-serif text-xl font-bold text-[#d4af37]">HSI Stakes</h3>
                  <p className="font-sans text-sm text-[#7c7a76] mt-1">{hsiStakes.length} stake{hsiStakes.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="space-y-2">
                  {hsiStakes.map((stake) => (
                    <div key={`${stake.wallet}-${stake.stakeId}`} className={`rounded-lg border px-4 py-3 font-sans text-sm font-medium ${stake.isActive ? 'border-[#2a2a35] bg-[#101017] text-green-400' : 'border-[#2a2a35] bg-[#0a0a0c] text-slate-400'}`}>
                      Day {stake.daysPassed}/{stake.stakedDays} ({stake.daysRemaining} days left) — {Number(stake.stakedHearts).toLocaleString(undefined, { maximumFractionDigits: 0 })} HSI — {Number(stake.stakeShares).toLocaleString(undefined, { maximumFractionDigits: 2 })} T-shares{stake.isAutoStake ? ' (Auto)' : ''} — {stake.wallet.slice(0, 4)}…{stake.wallet.slice(-4)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Liquid Loans Tab */}
            {activeTab === 'liquidloans' && liquidLoans.length > 0 && (
              <div className="mb-12">
                <div className="mb-6">
                  <h3 className="font-serif text-xl font-bold text-[#d4af37]">Liquid Loans Positions</h3>
                  <p className="font-sans text-sm text-[#7c7a76] mt-1">{liquidLoans.length} active position{liquidLoans.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="grid gap-4">
                  {liquidLoans.map((loan) => (
                      <div key={loan.wallet} className="rounded-lg border border-[#2a2a35] bg-[#101017] p-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="font-sans text-xs text-[#7c7a76]">Collateral</p>
                            <p className="font-serif font-semibold text-[#d4af37] mt-1">${loan.lockedPLS.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
                            <p className="font-sans text-xs text-[#7c7a76] mt-1">PLS</p>
                          </div>
                          <div>
                            <p className="font-sans text-xs text-[#7c7a76]">Debt</p>
                            <p className="font-serif font-semibold text-[#d4af37] mt-1">${loan.debt.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
                            <p className="font-sans text-xs text-[#7c7a76] mt-1">USDL</p>
                          </div>
                          <div>
                            <p className="font-sans text-xs text-[#7c7a76]">Ratio</p>
                            <p className="font-serif font-semibold text-[#3fbf6f] mt-1">{loan.lockedPLS > 0 ? ((loan.debt / loan.lockedPLS) * 100).toFixed(1) : '0'}%</p>
                          </div>
                        </div>
                        <p className="font-sans text-xs text-[#7c7a76] mt-4 truncate">{loan.wallet}</p>
                      </div>
                    ))}
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
