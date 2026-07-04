'use client'

import { useState } from 'react'

interface DurationOption {
  label: string
  days: number
  tier: string
}

const DURATIONS: DurationOption[] = [
  { label: '30 days (Hatchling)', days: 30, tier: 'Hatchling' },
  { label: '90 days (Drake)', days: 90, tier: 'Drake' },
  { label: '180 days (Dragon)', days: 180, tier: 'Dragon' },
  { label: '365 days (Elder Dragon)', days: 365, tier: 'Elder Dragon' },
  { label: '730 days (Smaug)', days: 1095, tier: 'Smaug' },
]

const TIER_MULTIPLIERS: { [key: string]: { multiplier: number; feeRebate: number } } = {
  Hatchling: { multiplier: 1, feeRebate: 5 },
  Drake: { multiplier: 1.5, feeRebate: 10 },
  Dragon: { multiplier: 2, feeRebate: 20 },
  'Elder Dragon': { multiplier: 3, feeRebate: 30 },
  Smaug: { multiplier: 5, feeRebate: 40 },
}

export default function RewardSimulator() {
  // TODO: Connect to actual contract for APR
  const baseAPR = 38.42
  const [amount, setAmount] = useState('10,000')
  const [selectedDuration, setSelectedDuration] = useState(4) // Smaug (1095 days)

  const durationData = DURATIONS[selectedDuration]
  const tierData = TIER_MULTIPLIERS[durationData.tier]
  const multiplier = tierData.multiplier
  const feeRebate = tierData.feeRebate

  const estimatedAPY = baseAPR * multiplier * (1 + feeRebate / 100)
  const numericAmount = parseFloat(amount.replace(/,/g, '')) || 0
  const estimatedRewards = (numericAmount * estimatedAPY) / 100
  const estimatedRewardsAtDays = (estimatedRewards * durationData.days) / 365

  return (
    <div className="border border-[rgba(255,255,255,0.08)] rounded-lg bg-[#111116] p-8">
      <h2 className="font-serif text-2xl font-bold text-[#f4f4f4] mb-8">
        Reward Simulator
      </h2>

      <div className="space-y-6">
        {/* Amount Input */}
        <div>
          <label className="block font-sans text-sm font-semibold text-[#f4f4f4] mb-3">
            Amount
          </label>
          <div className="relative flex items-center">
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-[#0a0a0c] border border-[rgba(255,255,255,0.08)] rounded-lg px-4 py-3 text-[#f4f4f4] font-sans focus:outline-none focus:border-[#D8B13D]/50"
            />
            <span className="absolute right-4 text-[#D8B13D] font-sans font-semibold">
              SMAUG
            </span>
          </div>
        </div>

        {/* Duration Selector */}
        <div>
          <label className="block font-sans text-sm font-semibold text-[#f4f4f4] mb-3">
            Duration
          </label>
          <select
            value={selectedDuration}
            onChange={(e) => setSelectedDuration(parseInt(e.target.value))}
            className="w-full bg-[#0a0a0c] border border-[rgba(255,255,255,0.08)] rounded-lg px-4 py-3 text-[#f4f4f4] font-sans focus:outline-none focus:border-[#D8B13D]/50 appearance-none cursor-pointer"
          >
            {DURATIONS.map((dur, idx) => (
              <option key={dur.days} value={idx} className="bg-[#0a0a0c] text-[#f4f4f4]">
                {dur.days} days ({dur.tier})
              </option>
            ))}
          </select>
        </div>

        {/* Results Grid */}
        <div className="border border-[rgba(255,255,255,0.08)] rounded-lg bg-[#0a0a0c] p-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="font-sans text-xs font-semibold text-[#9a9a9a] uppercase tracking-wide mb-2">
                Est. Multiplier
              </p>
              <p className="font-serif text-xl font-bold text-[#f4f4f4]">
                {multiplier}x
              </p>
            </div>

            <div>
              <p className="font-sans text-xs font-semibold text-[#9a9a9a] uppercase tracking-wide mb-2">
                Fee Rebate
              </p>
              <p className="font-serif text-xl font-bold text-[#f4f4f4]">
                {feeRebate}%
              </p>
            </div>

            <div>
              <p className="font-sans text-xs font-semibold text-[#9a9a9a] uppercase tracking-wide mb-2">
                Est. APY
              </p>
              <p className="font-serif text-xl font-bold text-[#10b981]">
                {estimatedAPY.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>

        {/* Estimated Rewards */}
        <div className="border border-[#D8B13D]/30 rounded-lg bg-[#0a0a0c] p-6">
          <p className="font-sans text-xs font-semibold text-[#9a9a9a] uppercase tracking-wide mb-2">
            Est. Rewards ({durationData.days}d)
          </p>
          <p className="font-serif text-3xl font-bold text-[#D8B13D]">
            {estimatedRewardsAtDays.toLocaleString('en-US', { maximumFractionDigits: 2 })}
          </p>
          <p className="font-sans text-sm text-[#9a9a9a] mt-2">
            SMAUG
          </p>
        </div>

        {/* Simulate Button */}
        <button className="w-full bg-[#D8B13D]/10 border border-[#D8B13D] text-[#D8B13D] hover:bg-[#D8B13D]/20 font-sans font-bold py-3 px-6 rounded-lg transition-colors">
          {/* TODO: Connect to contract for actual simulation */}
          Simulate Rewards
        </button>
      </div>

      {/* Info note */}
      <div className="mt-6 flex items-start gap-3 p-4 bg-[#1a1a20] border border-[rgba(255,255,255,0.08)] rounded-lg">
        <span className="text-[#D8B13D] text-lg mt-0.5">ℹ️</span>
        <p className="font-sans text-sm text-[#9a9a9a]">
          Estimates are based on current APR and may vary.
        </p>
      </div>
    </div>
  )
}
