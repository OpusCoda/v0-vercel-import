"use client"

import { useState } from "react"
import { TrendingUp, ChevronRight, ArrowRight } from "lucide-react"

export function EarnDashboard() {
  const [activeTab, setActiveTab] = useState("overview")

  // Mock data
  const dailyRewards = {
    pls: { amount: 78.42, value: 42.81 },
    plsx: { amount: 31.76, value: 17.32 },
    smaug: { amount: 12.34, value: 10.58 },
    combinedApr: 38.6,
  }

  const earnings = {
    opus: {
      daily: 78.42,
      percentage: 22.4,
      balance: 1240000,
      totalEarned: 12431,
      token: "PLS",
    },
    coda: {
      daily: 31.76,
      percentage: 16.7,
      balance: 810000,
      totalEarned: 6218,
      token: "PLSX",
    },
    smaug: {
      daily: 12.34,
      percentage: 41.0,
      totalStaked: 152000,
      activeStakes: 4,
      token: "SMAUG",
    },
  }

  const globalStakingStats = {
    apr: "41.0%",
    totalStaked: "412M",
    tvl: "$183,000",
  }

  const activeStakes = [
    {
      id: "#1257",
      amount: 50000,
      duration: "365 days",
      started: "Jun 1, 2025",
      progress: 42,
      rewards: 4.11,
    },
    {
      id: "#1242",
      amount: 75000,
      duration: "730 days",
      started: "Apr 15, 2025",
      progress: 23,
      rewards: 6.17,
    },
    {
      id: "#1218",
      amount: 20000,
      duration: "180 days",
      started: "May 20, 2025",
      progress: 61,
      rewards: 1.62,
    },
    {
      id: "#1199",
      amount: 7000,
      duration: "90 days",
      started: "Jun 10, 2025",
      progress: 15,
      rewards: 0.44,
    },
  ]

  const ecosystemStats = [
    { label: "Total Stakers", value: "12,842", change: "+4.2% (7D)", icon: "👥" },
    { label: "Total Smaug Staked", value: "412M", change: "+3.1% (7D)", icon: "🔥" },
    { label: "Total Rewards Paid", value: "2.34M SMAUG", change: "All time", icon: "💰" },
    { label: "Treasury Value", value: "$1.28M", change: "+2.8% (7D)", icon: "🏛️" },
    { label: "Oath Locked", value: "18.4M", change: "+5.7% (7D)", icon: "🔐" },
  ]

  return (
    <main className="min-h-screen bg-[#0a0a0c] px-4 py-24 md:px-6 md:py-28">
      <div className="mx-auto max-w-7xl">
        {/* Header with Total Value */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="font-serif text-4xl font-bold text-[#d4af37] md:text-5xl">Earn Rewards</h1>
            <p className="mt-2 font-sans text-[#b8b6b1]">Stake Smaug and earn PLS, PLSX, and Coda rewards.</p>
          </div>
          <div className="rounded-lg border border-[#2a2a35] bg-[#101017] p-4">
            <div className="flex items-center gap-2">
              <span className="font-sans text-xs font-semibold text-[#7c7a76]">Total Value Earning</span>
              <TrendingUp className="h-4 w-4 text-[#d4af37]" />
            </div>
            <p className="mt-2 font-serif text-3xl font-bold text-[#d4af37]">$183,000</p>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="mb-12 grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-[#2a2a35] bg-[#101017] p-4">
            <p className="font-sans text-xs font-semibold text-[#7c7a76]">EST. DAILY REWARDS</p>
            <p className="mt-2 font-serif text-2xl font-bold text-[#d4af37]">{dailyRewards.pls.amount} <span className="text-sm">PLS</span></p>
            <p className="mt-1 font-sans text-xs text-[#7c7a76]">≈ ${dailyRewards.pls.value.toFixed(2)}</p>
          </div>
          <div className="rounded-lg border border-[#2a2a35] bg-[#101017] p-4">
            <p className="font-sans text-xs font-semibold text-[#7c7a76]">EST. DAILY REWARDS</p>
            <p className="mt-2 font-serif text-2xl font-bold text-[#d4af37]">{dailyRewards.plsx.amount} <span className="text-sm">PLSX</span></p>
            <p className="mt-1 font-sans text-xs text-[#7c7a76]">≈ ${dailyRewards.plsx.value.toFixed(2)}</p>
          </div>
          <div className="rounded-lg border border-[#2a2a35] bg-[#101017] p-4">
            <p className="font-sans text-xs font-semibold text-[#7c7a76]">EST. DAILY REWARDS</p>
            <p className="mt-2 font-serif text-2xl font-bold text-[#d4af37]">{dailyRewards.smaug.amount} <span className="text-sm">SMAUG</span></p>
            <p className="mt-1 font-sans text-xs text-[#7c7a76]">≈ ${dailyRewards.smaug.value.toFixed(2)}</p>
          </div>
          <div className="rounded-lg border border-[#2a2a35] bg-[#101017] p-4">
            <p className="font-sans text-xs font-semibold text-[#7c7a76]">EST. APR (COMBINED)</p>
            <p className="mt-2 font-serif text-2xl font-bold text-[#d4af37]">{dailyRewards.combinedApr}%</p>
            <p className="mt-1 font-sans text-xs text-[#7c7a76]">Across all positions</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8 border-b border-[#2a2a35]">
          <div className="flex gap-8">
            {["overview", "staking", "distribution"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 font-sans text-sm font-semibold uppercase transition-colors ${
                  activeTab === tab
                    ? "border-b-2 border-[#d4af37] text-[#d4af37]"
                    : "text-[#7c7a76] hover:text-[#b8b6b1]"
                }`}
              >
                {tab === "overview" && "Overview"}
                {tab === "staking" && "Staking"}
                {tab === "distribution" && "Distribution Stats"}
              </button>
            ))}
          </div>
        </div>

        {/* Your Earnings Cards */}
        <div className="mb-12">
          <h2 className="mb-6 font-serif text-2xl font-bold text-[#d4af37]">Your Earnings (auto-compounding)</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {/* Hold Opus */}
            <div className="rounded-lg border border-[#2a2a35] bg-gradient-to-br from-[#1a1f1a] to-[#101017] p-6">
              <div className="mb-4 flex items-center gap-3">
                <span className="text-2xl">💰</span>
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#d4af37]">Hold Opus</h3>
                  <p className="font-sans text-xs text-[#7c7a76]">Earn PLS automatically</p>
                </div>
              </div>
              <div className="space-y-4 border-t border-[#2a2a35] pt-4">
                <div>
                  <p className="font-sans text-xs font-semibold text-[#7c7a76]">DAILY REWARDS</p>
                  <div className="flex items-end justify-between">
                    <p className="font-serif text-2xl font-bold text-[#3fbf6f]">{earnings.opus.daily} <span className="text-sm">PLS</span></p>
                    <p className="font-sans text-xs font-semibold text-[#3fbf6f]">{earnings.opus.percentage}%</p>
                  </div>
                </div>
                <div>
                  <p className="font-sans text-xs font-semibold text-[#7c7a76]">YOUR BALANCE</p>
                  <p className="font-sans font-semibold text-[#b8b6b1]">{earnings.opus.balance.toLocaleString()} OPUS</p>
                </div>
                <div>
                  <p className="font-sans text-xs font-semibold text-[#7c7a76]">TOTAL EARNED (ALL TIME)</p>
                  <p className="font-sans font-semibold text-[#b8b6b1]">{earnings.opus.totalEarned.toLocaleString()} PLS</p>
                </div>
                <button className="flex items-center gap-2 font-sans text-sm font-semibold text-[#d4af37] transition-colors hover:text-[#e8c860]">
                  View details <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Hold Coda */}
            <div className="rounded-lg border border-[#2a2a35] bg-gradient-to-br from-[#1a1f2a] to-[#101017] p-6">
              <div className="mb-4 flex items-center gap-3">
                <span className="text-2xl">⚡</span>
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#d4af37]">Hold Coda</h3>
                  <p className="font-sans text-xs text-[#7c7a76]">Earn PLSX automatically</p>
                </div>
              </div>
              <div className="space-y-4 border-t border-[#2a2a35] pt-4">
                <div>
                  <p className="font-sans text-xs font-semibold text-[#7c7a76]">DAILY REWARDS</p>
                  <div className="flex items-end justify-between">
                    <p className="font-serif text-2xl font-bold text-[#4a9eff]">{earnings.coda.daily} <span className="text-sm">PLSX</span></p>
                    <p className="font-sans text-xs font-semibold text-[#4a9eff]">{earnings.coda.percentage}%</p>
                  </div>
                </div>
                <div>
                  <p className="font-sans text-xs font-semibold text-[#7c7a76]">YOUR BALANCE</p>
                  <p className="font-sans font-semibold text-[#b8b6b1]">{earnings.coda.balance.toLocaleString()} CODA</p>
                </div>
                <div>
                  <p className="font-sans text-xs font-semibold text-[#7c7a76]">TOTAL EARNED (ALL TIME)</p>
                  <p className="font-sans font-semibold text-[#b8b6b1]">{earnings.coda.totalEarned.toLocaleString()} PLSX</p>
                </div>
                <button className="flex items-center gap-2 font-sans text-sm font-semibold text-[#d4af37] transition-colors hover:text-[#e8c860]">
                  View details <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Stake Smaug */}
            <div className="rounded-lg border border-[#2a2a35] bg-gradient-to-br from-[#2a1a1a] to-[#101017] p-6">
              <div className="mb-4 flex items-center gap-3">
                <span className="text-2xl">🔥</span>
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#d4af37]">Stake Smaug</h3>
                  <p className="font-sans text-xs text-[#7c7a76]">Stake SMAUG to earn more SMAUG</p>
                </div>
              </div>
              <div className="space-y-4 border-t border-[#2a2a35] pt-4">
                <div>
                  <p className="font-sans text-xs font-semibold text-[#7c7a76]">DAILY REWARDS</p>
                  <div className="flex items-end justify-between">
                    <p className="font-serif text-2xl font-bold text-[#ff6b4a]">{earnings.smaug.daily} <span className="text-sm">SMAUG</span></p>
                    <p className="font-sans text-xs font-semibold text-[#ff6b4a]">{earnings.smaug.percentage}% APR</p>
                  </div>
                </div>
                <div>
                  <p className="font-sans text-xs font-semibold text-[#7c7a76]">TOTAL STAKED</p>
                  <p className="font-sans font-semibold text-[#b8b6b1]">{earnings.smaug.totalStaked.toLocaleString()} SMAUG</p>
                </div>
                <div>
                  <p className="font-sans text-xs font-semibold text-[#7c7a76]">ACTIVE STAKES</p>
                  <p className="font-sans font-semibold text-[#b8b6b1]">{earnings.smaug.activeStakes}</p>
                </div>
                <button className="flex items-center gap-2 font-sans text-sm font-semibold text-[#d4af37] transition-colors hover:text-[#e8c860]">
                  Manage stakes <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stake Smaug Details Section */}
        <section className="mb-12">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="font-serif text-2xl font-bold text-[#d4af37]">Stake Smaug</h2>
              <p className="mt-1 font-sans text-sm text-[#b8b6b1]">Lock your SMAUG and earn high rewards.</p>
            </div>
            <button className="rounded-lg bg-[#d4af37] px-6 py-3 font-sans font-semibold text-[#0a0a0c] transition-colors hover:bg-[#e8c860]">
              Create New Stake
            </button>
          </div>

          {/* Global Stats */}
          <div className="mb-8 rounded-lg border border-[#2a2a35] bg-[#101017] p-6">
            <p className="mb-6 font-sans text-xs font-semibold text-[#7c7a76]">GLOBAL STAKING STATS</p>
            <div className="grid gap-8 md:grid-cols-3">
              <div>
                <p className="font-sans text-xs text-[#7c7a76]">CURRENT APR</p>
                <p className="mt-2 font-serif text-3xl font-bold text-[#ff6b4a]">{globalStakingStats.apr}</p>
              </div>
              <div>
                <p className="font-sans text-xs text-[#7c7a76]">TOTAL STAKED</p>
                <p className="mt-2 font-serif text-3xl font-bold text-[#ff6b4a]">
                  {globalStakingStats.totalStaked} <span className="text-lg">SMAUG</span>
                </p>
              </div>
              <div>
                <p className="font-sans text-xs text-[#7c7a76]">TVL</p>
                <p className="mt-2 font-serif text-3xl font-bold text-[#ff6b4a]">{globalStakingStats.tvl}</p>
              </div>
            </div>
          </div>

          {/* Your Active Stakes Table */}
          <div className="rounded-lg border border-[#2a2a35] bg-[#101017] p-6">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="font-serif text-xl font-bold text-[#d4af37]">Your Active Stakes</h3>
              <button className="flex items-center gap-2 font-sans text-sm font-semibold text-[#d4af37] transition-colors hover:text-[#e8c860]">
                View all stakes <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#2a2a35]">
                    <th className="pb-3 text-left font-sans text-xs font-semibold text-[#7c7a76]">STAKE ID</th>
                    <th className="pb-3 text-left font-sans text-xs font-semibold text-[#7c7a76]">AMOUNT</th>
                    <th className="pb-3 text-left font-sans text-xs font-semibold text-[#7c7a76]">DURATION</th>
                    <th className="pb-3 text-left font-sans text-xs font-semibold text-[#7c7a76]">STARTED</th>
                    <th className="pb-3 text-left font-sans text-xs font-semibold text-[#7c7a76]">PROGRESS</th>
                    <th className="pb-3 text-right font-sans text-xs font-semibold text-[#7c7a76]">EST. REWARDS (DAILY)</th>
                  </tr>
                </thead>
                <tbody>
                  {activeStakes.map((stake, idx) => (
                    <tr key={idx} className="border-b border-[#2a2a35] hover:bg-[#0a0a0c] transition-colors">
                      <td className="py-4 font-sans text-sm font-semibold text-[#b8b6b1]">{stake.id}</td>
                      <td className="py-4 font-sans text-sm text-[#b8b6b1]">{stake.amount.toLocaleString()} SMAUG</td>
                      <td className="py-4 font-sans text-sm text-[#b8b6b1]">{stake.duration}</td>
                      <td className="py-4 font-sans text-sm text-[#b8b6b1]">{stake.started}</td>
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-32 rounded-full bg-[#2a2a35]">
                            <div className="h-full rounded-full bg-[#ff6b4a]" style={{ width: `${stake.progress}%` }} />
                          </div>
                          <span className="font-sans text-xs text-[#7c7a76]">{stake.progress}%</span>
                        </div>
                      </td>
                      <td className="py-4 text-right font-sans text-sm font-semibold text-[#ff6b4a]">{stake.rewards} SMAUG</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Ecosystem Overview */}
        <section>
          <h2 className="mb-6 font-serif text-2xl font-bold text-[#d4af37]">Ecosystem Overview</h2>
          <div className="grid gap-4 md:grid-cols-5">
            {ecosystemStats.map((stat, idx) => (
              <div key={idx} className="rounded-lg border border-[#2a2a35] bg-[#101017] p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-sans text-xs font-semibold text-[#7c7a76]">{stat.label}</p>
                    <p className="mt-2 font-serif text-2xl font-bold text-[#d4af37]">{stat.value}</p>
                    <p className="mt-1 font-sans text-xs text-[#7c7a76]">{stat.change}</p>
                  </div>
                  <span className="text-2xl">{stat.icon}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer Note */}
        <div className="mt-12 rounded-lg border border-[#2a2a35] bg-[#101017] p-6 text-center">
          <p className="font-sans text-sm text-[#7c7a76]">
            Rewards are distributed automatically via reflections. No claiming required.
          </p>
          <button className="mt-3 flex items-center justify-center gap-2 font-sans text-sm font-semibold text-[#d4af37] transition-colors hover:text-[#e8c860]">
            Learn more about how it works <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </main>
  )
}
