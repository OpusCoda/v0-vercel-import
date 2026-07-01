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

interface HoldingRow {
  token: string
  symbol: string
  balance: number
  value: number
  change24h: number
  icon: string
}

interface ActivityItem {
  id: string
  action: string
  amount: string
  wallet: string
  time: string
  icon: string
  color: string
}

export function PortfolioDashboard() {
  const [activeTab, setActiveTab] = useState('overview')

  // Mock data
  const totalPortfolioValue = 183420.75
  const change24h = 5.62

  const wallets: Wallet[] = [
    { id: '1', name: 'Main Wallet', address: '0xTA2b...86b0', balance: 98421.45, percentage: 53.6, status: 'Active' },
    { id: '2', name: 'Ledger', address: '0x3F44...3a2E', balance: 47280.15, percentage: 25.7, status: 'Active' },
    { id: '3', name: 'Trading Wallet', address: '0x5d21...7b1C', balance: 24732.31, percentage: 13.5, status: 'Active' },
    { id: '4', name: 'Long Term', address: '0x7e38...294f', balance: 13986.84, percentage: 7.3, status: 'Active' },
  ]

  const portfolioMetrics = [
    { label: 'Total Assets', value: '$183,420.75', change: '+5.62% (24h)', icon: '💰' },
    { label: 'Total Rewards (All Time)', value: '12,431 PLS', subvalue: '6,218 PLSX', icon: '🎁' },
    { label: 'Total Staked (Smaug)', value: '152,000 SMAUG', subvalue: '4 active stakes', icon: '🔥' },
    { label: 'Referrals Earned', value: '2,341.78 OATH', change: '+128.34 (24h)', icon: '👥' },
  ]

  const holdings: HoldingRow[] = [
    { token: 'OPUS', symbol: 'OPUS', balance: 1240000, value: 62421.20, change24h: 4.21, icon: '🟡' },
    { token: 'CODA', symbol: 'CODA', balance: 810000, value: 41380.35, change24h: 5.18, icon: '🔵' },
    { token: 'SMAUG', symbol: 'SMAUG', balance: 55100, value: 47280.15, change24h: 3.72, icon: '🔴' },
    { token: 'HEX', symbol: 'HEX', balance: 12350, value: 18642.50, change24h: -1.14, icon: '🟣' },
    { token: 'HSI', symbol: 'HSI', balance: 5000, value: 9696.55, change24h: 0.98, icon: '🟢' },
    { token: 'OATH', symbol: 'OATH', balance: 3421, value: 4000.00, change24h: 2.37, icon: '🟠' },
  ]

  const recentActivity: ActivityItem[] = [
    { id: '1', action: 'Staked Smaug', amount: '-10,000 SMAUG', wallet: 'Main Wallet', time: '2h ago', icon: '🔥', color: 'text-[#ff6b4a]' },
    { id: '2', action: 'PLS Reward', amount: '+78.42 PLS', wallet: 'Ledger', time: '5h ago', icon: '💰', color: 'text-[#3fbf6f]' },
    { id: '3', action: 'PLSX Reward', amount: '+31.76 PLSX', wallet: 'Trading Wallet', time: '7h ago', icon: '⚡', color: 'text-[#4a9eff]' },
    { id: '4', action: 'Received HEX', amount: '+1,250 HEX', wallet: 'Long Term', time: '1d ago', icon: '🟣', color: 'text-[#d4af37]' },
    { id: '5', action: 'Referral Reward', amount: '+12.34 OATH', wallet: 'Main Wallet', time: '1d ago', icon: '👥', color: 'text-[#d4af37]' },
  ]

  const assetAllocation = [
    { name: 'Opus', value: 62421.20, percentage: 34.0, color: '#d4af37' },
    { name: 'Coda', value: 41380.35, percentage: 22.6, color: '#4a9eff' },
    { name: 'Smaug', value: 47280.15, percentage: 25.7, color: '#ff6b4a' },
    { name: 'HEX', value: 18642.50, percentage: 10.2, color: '#9370db' },
    { name: 'HSI', value: 8696.55, percentage: 5.3, color: '#3fbf6f' },
    { name: 'Other', value: 4000.00, percentage: 2.2, color: '#7c7a76' },
  ]

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
                <p className="mt-3 font-serif text-3xl font-bold text-[#d4af37]">${totalPortfolioValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
                <p className="mt-2 font-sans text-sm font-semibold text-[#3fbf6f]">+{change24h}% (24h)</p>
              </div>
              <div className="text-[#d4af37]">
                <svg width="60" height="40" viewBox="0 0 60 40" className="opacity-80">
                  <polyline points="0,30 10,20 20,25 30,10 40,15 50,5 60,8" stroke="#d4af37" strokeWidth="2" fill="none" />
                  <polyline points="0,40 10,30 20,35 30,20 40,25 50,15 60,18" stroke="#d4af37" strokeWidth="1" fill="none" opacity="0.3" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Your Wallets Section */}
        <div className="mb-12">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-serif text-2xl font-bold text-[#d4af37]">Your Wallets <span className="text-lg text-[#7c7a76]">{wallets.length}</span></h2>
            <button className="flex items-center gap-2 rounded-lg border border-[#2a2a35] bg-[#101017] px-4 py-2 font-sans text-sm font-semibold text-[#d4af37] transition-colors hover:border-[#d4af37]/50">
              <Plus className="h-4 w-4" />
              Add Wallet
            </button>
          </div>

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
        </div>

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

        {/* Portfolio Overview */}
        <div className="mb-12">
          <h3 className="mb-6 font-serif text-xl font-bold text-[#d4af37]">Portfolio Overview</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {portfolioMetrics.map((metric, idx) => (
              <div key={idx} className="rounded-lg border border-[#2a2a35] bg-[#101017] p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-sans text-xs font-semibold text-[#7c7a76]">{metric.label}</p>
                    <p className="mt-2 font-serif font-bold text-[#d4af37]">{metric.value}</p>
                    {metric.subvalue && <p className="font-sans text-xs text-[#7c7a76]">{metric.subvalue}</p>}
                    {metric.change && <p className="mt-1 font-sans text-xs font-semibold text-[#3fbf6f]">{metric.change}</p>}
                  </div>
                  <span className="text-2xl">{metric.icon}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Asset Allocation & Holdings */}
        <div className="mb-12 grid gap-8 lg:grid-cols-2">
          {/* Asset Allocation */}
          <div className="rounded-lg border border-[#2a2a35] bg-[#101017] p-6">
            <h3 className="mb-6 font-serif text-lg font-bold text-[#d4af37]">Asset Allocation</h3>
            <div className="flex gap-8">
              <div className="flex-shrink-0">
                <svg width="120" height="120" viewBox="0 0 120 120" className="mx-auto">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#2a2a35" strokeWidth="2" />
                  {assetAllocation.map((asset, idx, arr) => {
                    const prevPercentage = arr.slice(0, idx).reduce((sum, a) => sum + a.percentage, 0)
                    const startAngle = (prevPercentage / 100) * 360 - 90
                    const endAngle = ((prevPercentage + asset.percentage) / 100) * 360 - 90
                    const startRad = (startAngle * Math.PI) / 180
                    const endRad = (endAngle * Math.PI) / 180
                    const x1 = 60 + 50 * Math.cos(startRad)
                    const y1 = 60 + 50 * Math.sin(startRad)
                    const x2 = 60 + 50 * Math.cos(endRad)
                    const y2 = 60 + 50 * Math.sin(endRad)
                    const largeArc = asset.percentage > 50 ? 1 : 0
                    return (
                      <path
                        key={idx}
                        d={`M 60 60 L ${x1} ${y1} A 50 50 0 ${largeArc} 1 ${x2} ${y2} Z`}
                        fill={asset.color}
                      />
                    )
                  })}
                </svg>
                <p className="mt-4 text-center font-serif text-lg font-bold text-[#d4af37]">
                  ${totalPortfolioValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                </p>
                <p className="text-center font-sans text-xs text-[#7c7a76]">Total</p>
              </div>
              <div className="flex-1 space-y-3">
                {assetAllocation.map((asset, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: asset.color }} />
                      <span className="font-sans text-sm text-[#b8b6b1]">{asset.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-sans text-sm font-semibold text-[#d4af37]">${asset.value.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
                      <p className="font-sans text-xs text-[#7c7a76]">{asset.percentage}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button className="mt-6 flex items-center gap-2 font-sans text-sm font-semibold text-[#d4af37] transition-colors hover:text-[#e8c860]">
              View all assets <TrendingUp className="h-4 w-4" />
            </button>
          </div>

          {/* Holdings by Token */}
          <div className="rounded-lg border border-[#2a2a35] bg-[#101017] p-6">
            <h3 className="mb-6 font-serif text-lg font-bold text-[#d4af37]">Holdings by Token</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2a2a35]">
                    <th className="pb-3 text-left font-sans text-xs font-semibold text-[#7c7a76]">Token</th>
                    <th className="pb-3 text-right font-sans text-xs font-semibold text-[#7c7a76]">Total Balance</th>
                    <th className="pb-3 text-right font-sans text-xs font-semibold text-[#7c7a76]">Value (USD)</th>
                    <th className="pb-3 text-right font-sans text-xs font-semibold text-[#7c7a76]">24h Change</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((holding, idx) => (
                    <tr key={idx} className="border-b border-[#2a2a35] hover:bg-[#0a0a0c] transition-colors">
                      <td className="py-3 font-sans font-semibold text-[#b8b6b1]">
                        <span className="mr-2">{holding.icon}</span>
                        {holding.token}
                      </td>
                      <td className="py-3 text-right font-sans text-[#b8b6b1]">{holding.balance.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                      <td className="py-3 text-right font-sans font-semibold text-[#d4af37]">${holding.value.toLocaleString('en-US', { maximumFractionDigits: 2 })}</td>
                      <td className={`py-3 text-right font-sans font-semibold ${holding.change24h >= 0 ? 'text-[#3fbf6f]' : 'text-[#ff6b4a]'}`}>
                        {holding.change24h >= 0 ? '+' : ''}{holding.change24h.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between border-b border-[#2a2a35] pb-4 last:border-b-0">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{activity.icon}</span>
                    <div>
                      <p className="font-sans font-semibold text-[#b8b6b1]">{activity.action}</p>
                      <p className="font-sans text-xs text-[#7c7a76]">{activity.wallet}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div>
                      <p className={`font-sans font-semibold ${activity.color}`}>{activity.amount}</p>
                      <p className="font-sans text-xs text-[#7c7a76]">{activity.time}</p>
                    </div>
                    <button className="text-[#7c7a76] hover:text-[#d4af37] transition-colors">
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
