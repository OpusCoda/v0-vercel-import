'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useAccount } from 'wagmi'
import { ConnectWalletButton } from './connect-wallet-button'

interface Position {
  id: string
  market: string
  amount: string
  status: 'active' | 'resolved'
}

interface PortfolioCard {
  type: 'probability' | 'oath' | 'smaug' | 'referral'
  active?: number
  value?: string
  locked?: string
  pending?: string
  tier?: string
  staked?: string
  rewards?: string
  ends?: string
  name?: string
  referrals?: number
  earned?: string
}

export function PortfolioDashboard() {
  const { address: connectedAddress, isConnected } = useAccount()
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [selectedModal, setSelectedModal] = useState<'probability' | 'oath' | null>(null)

  // Mock data
  const portfolioStats = {
    value: '18,492',
    pending: '287',
    earnings24h: '+14.2',
    feeRebate: '20%',
  }

  const cards: Record<string, PortfolioCard> = {
    probability: {
      type: 'probability',
      active: 6,
      value: '2,410',
      pending: '+214',
    },
    oath: {
      type: 'oath',
      active: 3,
      locked: '920',
      pending: '+110',
    },
    smaug: {
      type: 'smaug',
      tier: 'Elder Dragon',
      staked: '150,000',
      rewards: '91',
      ends: '213 days',
    },
    referral: {
      type: 'referral',
      name: 'dragon',
      referrals: 27,
      earned: '341',
    },
  }

  const probabilityPositions: Position[] = [
    { id: '1', market: 'BTC > $180k', amount: '210 PLS', status: 'active' },
    { id: '2', market: 'ETH ETF', amount: '430 PLS', status: 'active' },
    { id: '3', market: 'Trump Election', amount: '185 PLS', status: 'active' },
  ]

  const oathPositions: Position[] = [
    { id: '1', market: 'PLS above $0.0001', amount: '2,000 PLS (YES)', status: 'active' },
    { id: '2', market: 'Man United wins', amount: '1,500 PLS (NO)', status: 'active' },
  ]

  const recentActivity = [
    { icon: '✓', text: 'Won BTC > $180k prediction (+92 PLS)' },
    { icon: '✓', text: 'Claimed staking rewards (+17 PLS)' },
    { icon: '✓', text: 'Referral reward (+3.1 PLS)' },
    { icon: '→', text: 'Created Oath "Norway beats Sweden"' },
    { icon: '→', text: 'Stake #14 started' },
  ]

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(section)) {
        newSet.delete(section)
      } else {
        newSet.add(section)
      }
      return newSet
    })
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] pt-32 px-4 md:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="font-serif text-3xl md:text-4xl font-semibold text-[#d4af37] mb-4">
            My Portfolio
          </h1>
          <p className="font-sans text-[#7c7a76] mb-8">Connect your wallet to view your portfolio</p>
          <ConnectWalletButton />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] pt-24 md:pt-28 px-4 md:px-8 pb-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="font-serif text-3xl md:text-4xl font-semibold text-[#d4af37]">My Portfolio</h1>
          <div className="font-sans text-xs text-[#7c7a76]">Wallet Connected</div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Portfolio Value', value: portfolioStats.value, unit: 'PLS' },
            { label: 'Pending Rewards', value: portfolioStats.pending, unit: 'PLS' },
            { label: '24h Earnings', value: portfolioStats.earnings24h, unit: 'PLS' },
            { label: 'Fee Rebate', value: portfolioStats.feeRebate, unit: '' },
          ].map((stat, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-[#2a2a35] bg-[#101017] p-4"
            >
              <p className="font-sans text-xs text-[#7c7a76] mb-2">{stat.label}</p>
              <p className="font-serif text-2xl font-semibold text-[#d4af37]">
                {stat.value}
              </p>
              {stat.unit && <p className="font-sans text-xs text-[#7c7a76] mt-1">{stat.unit}</p>}
            </div>
          ))}
        </div>

        {/* Portfolio Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Probability Shop */}
          <div className="rounded-lg border border-[#2a2a35] bg-[#101017] p-6">
            <h3 className="font-serif text-lg font-semibold text-[#d4af37] mb-4">Probability Shop</h3>
            <div className="space-y-2 mb-6 font-sans text-sm">
              <p className="text-[#b8b6b1]">
                Active: <span className="text-[#d4af37]">{cards.probability.active}</span>
              </p>
              <p className="text-[#b8b6b1]">
                Value: <span className="text-[#d4af37]">{cards.probability.value} PLS</span>
              </p>
              <p className="text-[#b8b6b1]">
                Pending: <span className="text-green-500">{cards.probability.pending} PLS</span>
              </p>
            </div>
            <button
              onClick={() => setSelectedModal('probability')}
              className="w-full rounded px-3 py-2 font-sans text-sm font-semibold bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/30 hover:bg-[#d4af37]/20 transition-colors"
            >
              View Positions
            </button>
          </div>

          {/* Oath Market */}
          <div className="rounded-lg border border-[#2a2a35] bg-[#101017] p-6">
            <h3 className="font-serif text-lg font-semibold text-[#d4af37] mb-4">Oath Market</h3>
            <div className="space-y-2 mb-6 font-sans text-sm">
              <p className="text-[#b8b6b1]">
                Active: <span className="text-[#d4af37]">{cards.oath.active}</span>
              </p>
              <p className="text-[#b8b6b1]">
                Locked: <span className="text-[#d4af37]">{cards.oath.locked} PLS</span>
              </p>
              <p className="text-[#b8b6b1]">
                Pending: <span className="text-green-500">{cards.oath.pending} PLS</span>
              </p>
            </div>
            <button
              onClick={() => setSelectedModal('oath')}
              className="w-full rounded px-3 py-2 font-sans text-sm font-semibold bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/30 hover:bg-[#d4af37]/20 transition-colors"
            >
              View Oaths
            </button>
          </div>

          {/* Smaug Staking */}
          <div className="rounded-lg border border-[#2a2a35] bg-[#101017] p-6">
            <h3 className="font-serif text-lg font-semibold text-[#d4af37] mb-4">Smaug Staking</h3>
            <div className="space-y-2 mb-6 font-sans text-sm">
              <p className="text-[#b8b6b1]">
                Tier: <span className="text-[#d4af37]">{cards.smaug.tier}</span>
              </p>
              <p className="text-[#b8b6b1]">
                Staked: <span className="text-[#d4af37]">{cards.smaug.staked}</span>
              </p>
              <p className="text-[#b8b6b1]">
                Rewards: <span className="text-green-500">{cards.smaug.rewards} PLS</span>
              </p>
              <p className="text-[#7c7a76] text-xs">Ends: {cards.smaug.ends}</p>
            </div>
            <button
              disabled
              className="w-full rounded px-3 py-2 font-sans text-sm font-semibold bg-[#2a2a35] text-[#7c7a76] opacity-50 cursor-not-allowed"
            >
              Claim Rewards
            </button>
          </div>

          {/* Referral */}
          <div className="rounded-lg border border-[#2a2a35] bg-[#101017] p-6">
            <h3 className="font-serif text-lg font-semibold text-[#d4af37] mb-4">Referral</h3>
            <div className="space-y-2 mb-6 font-sans text-sm">
              <p className="text-[#b8b6b1]">
                Name: <span className="text-[#d4af37]">{cards.referral.name}</span>
              </p>
              <p className="text-[#b8b6b1]">
                Referrals: <span className="text-[#d4af37]">{cards.referral.referrals}</span>
              </p>
              <p className="text-[#b8b6b1]">
                Earned: <span className="text-green-500">{cards.referral.earned} PLS</span>
              </p>
            </div>
            <button className="w-full rounded px-3 py-2 font-sans text-sm font-semibold bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/30 hover:bg-[#d4af37]/20 transition-colors">
              Copy Referral Link
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-lg border border-[#2a2a35] bg-[#101017] p-6">
          <button
            onClick={() => toggleSection('activity')}
            className="flex items-center justify-between w-full mb-4"
          >
            <h3 className="font-serif text-lg font-semibold text-[#d4af37]">Recent Activity</h3>
            <ChevronDown
              size={20}
              className={`text-[#7c7a76] transition-transform ${
                expandedSections.has('activity') ? 'rotate-180' : ''
              }`}
            />
          </button>
          {expandedSections.has('activity') && (
            <div className="space-y-2 font-sans text-sm">
              {recentActivity.map((item, idx) => (
                <p key={idx} className="text-[#b8b6b1]">
                  {item.icon} {item.text}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Modals */}
        {selectedModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-[#101017] rounded-lg border border-[#2a2a35] max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="sticky top-0 bg-[#101017] border-b border-[#2a2a35] p-6 flex items-center justify-between">
                <h2 className="font-serif text-2xl font-semibold text-[#d4af37]">
                  {selectedModal === 'probability' ? 'Probability Shop' : 'Oath Market'}
                </h2>
                <button
                  onClick={() => setSelectedModal(null)}
                  className="text-[#7c7a76] hover:text-[#d4af37] text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="p-6">
                <h3 className="font-sans text-sm font-semibold text-[#b8b6b1] mb-4">Open Positions</h3>
                <div className="space-y-3 mb-6">
                  {(selectedModal === 'probability'
                    ? probabilityPositions
                    : oathPositions
                  ).map((pos) => (
                    <div
                      key={pos.id}
                      className="flex items-center justify-between p-3 rounded border border-[#2a2a35] bg-[#0a0a0c]"
                    >
                      <span className="font-sans text-sm text-[#b8b6b1]">{pos.market}</span>
                      <span className="font-sans text-sm text-[#d4af37]">{pos.amount}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => toggleSection(`resolved-${selectedModal}`)}
                  className="flex items-center gap-2 font-sans text-sm font-semibold text-[#d4af37] mb-4"
                >
                  Resolved Positions
                  <ChevronDown
                    size={16}
                    className={`transition-transform ${
                      expandedSections.has(`resolved-${selectedModal}`) ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {expandedSections.has(`resolved-${selectedModal}`) && (
                  <div className="space-y-3 mb-6 text-center text-[#7c7a76] font-sans text-sm">
                    <p>No resolved positions yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
