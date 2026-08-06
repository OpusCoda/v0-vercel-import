'use client'
import { useState } from 'react'
import { SiteNav } from "@/components/landing/site-nav"
import { SiteFooter } from "@/components/landing/site-footer"
import MarketsOverview from "@/components/landing/markets-overview"
import { PositionsDashboard } from "@/components/markets/positions-dashboard"
import { MarketsList } from "@/components/landing/markets-list"
import { PlatformOverview } from "@/components/markets/platform-overview"
import { CreateWager } from "@/components/markets/create-wager"
import { WalletContextPrompt } from '@/components/wallet-context-prompt'

type Tab = 'all' | 'p2p' | 'probability' | 'my-wagers'

export default function MarketsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('all')

  const tabs: { id: Tab; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'probability', label: 'Probability Shop' },
    { id: 'p2p', label: 'Wager Market' },
    { id: 'my-wagers', label: 'My Positions' },
  ]

  // Which sections show per tab:
  //   all         → two-column browse + stats + create/open + overview
  //   p2p         → full-width P2P browse + stats + create/open
  //   probability → full-width Probability browse only
  //   my-wagers   → personal dashboard only
  const showP2PExtras = activeTab === 'all' || activeTab === 'p2p'

  return (
    <main className="min-h-screen bg-[#0a0a0c]">
      <SiteNav />
      <div className="mx-auto max-w-7xl px-6 pt-4">
        <WalletContextPrompt />
      </div>
      {/* Tab Navigation */}
      <div className="py-3">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex justify-center gap-3">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium rounded-full border transition-all ${
                  activeTab === tab.id
                    ? 'border-[#d8b13d] bg-[#d8b13d]/10 text-[#d8b13d]'
                    : 'border-[#2a2a35] text-[#9a9a9a] hover:border-[#3a3a45] hover:text-[#b8b6b1]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Platform Overview — hidden on the My Positions tab */}
      {activeTab !== 'my-wagers' && (
        <div className="mx-auto max-w-7xl px-6">
          <PlatformOverview />
        </div>
      )}

      <div className="mx-auto max-w-7xl px-6">
        {activeTab === 'my-wagers' ? (
          /* Personal dashboard view */
          <div className="py-3">
            <PositionsDashboard />
          </div>
        ) : (
          <>
            {/* Market Browse Section */}
            <div className="py-3">
              <MarketsList variant={activeTab} />
            </div>
            {showP2PExtras && (
              <>
                {/* Create Wager */}
                <div className="py-8">
                  <CreateWager />
                </div>
              </>
            )}
            {activeTab === 'all' && (
              /* Markets Overview */
              <div className="py-12 border-t border-[#2a2a35]">
                <MarketsOverview />
              </div>
            )}
          </>
        )}
      </div>
      <SiteFooter />
    </main>
  )
}