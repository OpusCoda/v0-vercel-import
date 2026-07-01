"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

export function EarnDashboard() {
  const [expandedStakes, setExpandedStakes] = useState(false)

  // Mock data
  const globalData = {
    apr: "41%",
    totalStaked: "412M",
    tvl: "$183,000",
  }

  const activeStakes = [
    { amount: 5000, duration: "180 days", progress: 75, rewards: 450 },
    { amount: 2000, duration: "90 days", progress: 50, rewards: 120 },
  ]

  const opusRewards = {
    total: 2318,
    last24h: 12,
  }

  const codaRewards = {
    total: 1942,
    last24h: 8,
  }

  return (
    <main className="min-h-screen bg-[#0a0a0c] px-4 py-24 md:px-6 md:py-28">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="font-serif text-4xl font-bold text-[#d4af37] md:text-5xl">Earn Rewards</h1>
          <p className="mt-2 font-sans text-[#b8b6b1]">Stake Smaug and earn PLS, PLSX, and Coda rewards</p>
        </div>

        {/* Stake Smaug Section */}
        <section className="mb-12 rounded-2xl border border-[#2a2a35] bg-[#101017] p-8">
          <div className="mb-6 flex items-center gap-3">
            <span className="text-3xl">🔥</span>
            <h2 className="font-serif text-2xl font-bold text-[#d4af37]">Stake Smaug</h2>
          </div>

          {/* Global Data */}
          <div className="mb-8 rounded-lg bg-[#0a0a0c] p-4">
            <p className="mb-3 font-sans text-xs font-semibold text-[#7c7a76]">GLOBAL DATA</p>
            <div className="flex flex-wrap gap-6">
              <div>
                <p className="font-sans text-xs text-[#7c7a76]">Current APR</p>
                <p className="font-serif text-xl font-bold text-[#d4af37]">{globalData.apr}</p>
              </div>
              <div>
                <p className="font-sans text-xs text-[#7c7a76]">Total Staked</p>
                <p className="font-serif text-xl font-bold text-[#d4af37]">{globalData.totalStaked}</p>
              </div>
              <div>
                <p className="font-sans text-xs text-[#7c7a76]">TVL</p>
                <p className="font-serif text-xl font-bold text-[#d4af37]">{globalData.tvl}</p>
              </div>
            </div>
          </div>

          {/* Your Stakes */}
          <div className="border-t border-[#2a2a35] pt-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="font-sans text-xs font-semibold text-[#7c7a76]">YOUR ACTIVE STAKES</p>
                <p className="mt-1 font-serif text-lg font-bold text-[#d4af37]">{activeStakes.length} stakes</p>
              </div>
              <button
                onClick={() => setExpandedStakes(!expandedStakes)}
                className="flex items-center gap-2 rounded-lg border border-[#2a2a35] bg-[#0a0a0c] px-4 py-2 font-sans text-sm font-semibold text-[#d4af37] transition-colors hover:border-[#d4af37]/50"
              >
                {expandedStakes ? "Hide" : "View"} Stakes
                <ChevronDown className={`h-4 w-4 transition-transform ${expandedStakes ? "rotate-180" : ""}`} />
              </button>
            </div>

            {/* Total Staked Summary */}
            <div className="mt-4 rounded-lg bg-[#0a0a0c] p-4">
              <p className="font-sans text-xs text-[#7c7a76]">Total Smaug Staked</p>
              <p className="font-serif text-2xl font-bold text-[#d4af37]">
                {activeStakes.reduce((sum, s) => sum + s.amount, 0).toLocaleString()} SMAUG
              </p>
            </div>

            {/* Stakes Dropdown */}
            {expandedStakes && (
              <div className="mt-6 space-y-3">
                {activeStakes.map((stake, idx) => (
                  <div key={idx} className="rounded-lg border border-[#2a2a35] bg-[#0a0a0c] p-4">
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                      <div>
                        <p className="font-sans text-xs text-[#7c7a76]">Amount</p>
                        <p className="font-serif font-bold text-[#d4af37]">{stake.amount.toLocaleString()} SMAUG</p>
                      </div>
                      <div>
                        <p className="font-sans text-xs text-[#7c7a76]">Duration</p>
                        <p className="font-sans font-semibold text-[#b8b6b1]">{stake.duration}</p>
                      </div>
                      <div>
                        <p className="font-sans text-xs text-[#7c7a76]">Progress</p>
                        <div className="mt-1 h-2 rounded-full bg-[#2a2a35]">
                          <div className="h-full rounded-full bg-[#d4af37]" style={{ width: `${stake.progress}%` }} />
                        </div>
                        <p className="mt-1 font-sans text-xs text-[#7c7a76]">{stake.progress}%</p>
                      </div>
                      <div>
                        <p className="font-sans text-xs text-[#7c7a76]">Rewards Earned</p>
                        <p className="font-serif font-bold text-[#d4af37]">{stake.rewards} PLS</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Rewards Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Hold Opus */}
          <section className="rounded-2xl border border-[#2a2a35] bg-[#101017] p-8">
            <div className="mb-6 flex items-center gap-3">
              <span className="text-3xl">💰</span>
              <h2 className="font-serif text-2xl font-bold text-[#d4af37]">Hold Opus</h2>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg bg-[#0a0a0c] p-4">
                <p className="font-sans text-xs font-semibold text-[#7c7a76]">PLS DISTRIBUTED TO YOU</p>
                <p className="mt-2 font-serif text-3xl font-bold text-[#d4af37]">{opusRewards.total.toLocaleString()} PLS</p>
                <p className="mt-2 font-sans text-xs text-[#7c7a76]">Last 24h: +{opusRewards.last24h} PLS</p>
              </div>

              <button className="w-full rounded-lg border border-[#2a2a35] bg-[#0a0a0c] px-4 py-3 font-sans text-sm font-semibold text-[#d4af37] transition-colors hover:border-[#d4af37]/50">
                Claim Rewards
              </button>
            </div>
          </section>

          {/* Hold Coda */}
          <section className="rounded-2xl border border-[#2a2a35] bg-[#101017] p-8">
            <div className="mb-6 flex items-center gap-3">
              <span className="text-3xl">⚡</span>
              <h2 className="font-serif text-2xl font-bold text-[#d4af37]">Hold Coda</h2>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg bg-[#0a0a0c] p-4">
                <p className="font-sans text-xs font-semibold text-[#7c7a76]">PLSX DISTRIBUTED TO YOU</p>
                <p className="mt-2 font-serif text-3xl font-bold text-[#d4af37]">{codaRewards.total.toLocaleString()} PLSX</p>
                <p className="mt-2 font-sans text-xs text-[#7c7a76]">Last 24h: +{codaRewards.last24h} PLSX</p>
              </div>

              <button className="w-full rounded-lg border border-[#2a2a35] bg-[#0a0a0c] px-4 py-3 font-sans text-sm font-semibold text-[#d4af37] transition-colors hover:border-[#d4af37]/50">
                Claim Rewards
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
