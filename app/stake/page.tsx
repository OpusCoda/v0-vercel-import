'use client'

import { useState } from 'react'
import StatCard from '@/components/stake/stat-card'
import CreateStakeCard from '@/components/stake/create-stake-card'
import TierProgression from '@/components/stake/tier-progression'
import YourStakes from '@/components/stake/your-stakes'
import ProtocolStatistics from '@/components/stake/protocol-statistics'
import RewardSimulator from '@/components/stake/reward-simulator'

export default function StakePage() {
  // TODO: Connect to actual contract: 0x1DafEa6eBDaFd2BD9c3fBf86DFccccAbBB0E3bda
  // Mock data for demonstration
  const stats = {
    currentAPR: 38.42,
    totalValueLocked: 183642.18,
    totalStaked: 52718392,
    activeStakers: 1284,
  }

  return (
    <main className="min-h-screen bg-[#09090B] text-[#f4f4f4]">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 py-20 md:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 md:grid-cols-2 md:gap-20">
            <div className="flex flex-col justify-center">
              <h1 className="font-serif text-5xl font-bold text-[#f4f4f4] md:text-6xl">
                Stake Smaug
              </h1>
              <p className="mt-6 text-lg text-[#9a9a9a] leading-relaxed max-w-md">
                Stake your $SMAUG and earn rewards with boosted multipliers and fee rebates the longer you commit.
              </p>

              {/* Stats Grid */}
              <div className="mt-12 grid grid-cols-2 gap-6 md:gap-8">
                <StatCard
                  label="CURRENT APR"
                  value={`${stats.currentAPR}%`}
                  sublabel="Variable"
                />
                <StatCard
                  label="TOTAL VALUE LOCKED"
                  value={`$${stats.totalValueLocked.toLocaleString('en-US', { maximumFractionDigits: 2 })}`}
                  sublabel={`${(stats.totalStaked / 1000000).toFixed(0)}M SMAUG`}
                />
                <StatCard
                  label="TOTAL STAKED"
                  value={`${stats.totalStaked.toLocaleString('en-US')}`}
                  sublabel="SMAUG"
                />
                <StatCard
                  label="ACTIVE STAKERS"
                  value={stats.activeStakers.toLocaleString('en-US')}
                  sublabel="Addresses"
                />
              </div>
            </div>

            {/* Dragon image placeholder */}
            <div className="hidden md:flex items-center justify-end">
              <div className="w-full h-96 bg-gradient-to-br from-[#D8B13D]/10 to-transparent rounded-lg border border-[#D8B13D]/20" />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-3 lg:gap-12">
            {/* Left Column - Create Stake */}
            <div className="lg:col-span-2">
              <CreateStakeCard />
            </div>

            {/* Right Column - Tier Progression */}
            <div>
              <TierProgression />
            </div>
          </div>
        </div>
      </section>

      {/* Your Stakes Section */}
      <section className="px-6 py-20 border-t border-[rgba(255,255,255,0.08)]">
        <div className="mx-auto max-w-7xl">
          <YourStakes />
        </div>
      </section>

      {/* Bottom Sections */}
      <section className="px-6 py-20 border-t border-[rgba(255,255,255,0.08)]">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-2">
            <ProtocolStatistics />
            <RewardSimulator />
          </div>
        </div>
      </section>
    </main>
  )
}
