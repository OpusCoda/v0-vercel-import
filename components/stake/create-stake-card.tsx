'use client'

import { useState } from 'react'

interface DurationOption {
  days: number
  label: string
  tier: string
  multiplier: number
  feeRebate: number
}

const DURATION_OPTIONS: DurationOption[] = [
  { days: 30, label: '30\nHatchling', tier: 'Hatchling', multiplier: 1, feeRebate: 5 },
  { days: 90, label: '90\nDrake', tier: 'Drake', multiplier: 1.5, feeRebate: 10 },
  { days: 180, label: '180\nDragon', tier: 'Dragon', multiplier: 2, feeRebate: 20 },
  { days: 365, label: '365\nElder Dragon', tier: 'Elder Dragon', multiplier: 3, feeRebate: 30 },
  { days: 730, label: '730\nSmaug', tier: 'Smaug', multiplier: 5, feeRebate: 40 },
]

export default function CreateStakeCard() {
  // TODO: Connect to actual wallet balance and contract
  const [amount, setAmount] = useState('10,000')
  const [selectedDays, setSelectedDays] = useState(730)
  const walletBalance = 25430.72

  const selectedOption = DURATION_OPTIONS.find((opt) => opt.days === selectedDays)

  const estimatedAPY = selectedOption
    ? (38.42 * selectedOption.multiplier * (1 + selectedOption.feeRebate / 100)).toFixed(2)
    : '192.10'

  return (
    <div className="space-y-8">
      {/* Create New Stake Card */}
      <div className="border border-[rgba(255,255,255,0.08)] rounded-lg bg-[#111116] p-8">
        <h2 className="font-serif text-2xl font-bold text-[#f4f4f4] mb-8">
          Create New Stake
        </h2>

        {/* 1. Enter Amount */}
        <div className="mb-8">
          <label className="block font-sans text-sm font-medium text-[#f4f4f4] mb-4">
            1. Enter Amount
          </label>
          <div className="relative flex items-center">
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-[#0a0a0c] border border-[rgba(255,255,255,0.08)] rounded-lg px-4 py-3 text-[#f4f4f4] font-sans text-lg focus:outline-none focus:border-[#D8B13D]/50"
            />
            <div className="absolute right-4 flex items-center gap-2">
              <span className="text-[#D8B13D] font-sans font-semibold">SMAUG</span>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3">
            <p className="font-sans text-sm text-[#9a9a9a]">
              Balance: {walletBalance.toLocaleString('en-US', { maximumFractionDigits: 2 })} SMAUG
            </p>
            <button className="font-sans text-sm font-semibold text-[#D8B13D] hover:text-[#D8B13D]/80">
              MAX
            </button>
          </div>
        </div>

        {/* 2. Choose Duration */}
        <div className="mb-8">
          <label className="block font-sans text-sm font-medium text-[#f4f4f4] mb-4">
            2. Choose Duration
          </label>
          <div className="grid grid-cols-5 gap-3 mb-6">
            {DURATION_OPTIONS.map((option) => (
              <button
                key={option.days}
                onClick={() => setSelectedDays(option.days)}
                className={`py-4 px-3 rounded-lg border font-sans text-xs font-semibold text-center transition-all ${
                  selectedDays === option.days
                    ? 'bg-[#0a0a0c] border-[#D8B13D] text-[#D8B13D]'
                    : 'bg-[#0a0a0c] border-[rgba(255,255,255,0.08)] text-[#9a9a9a] hover:border-[rgba(255,255,255,0.15)]'
                }`}
              >
                <div className="whitespace-pre-line leading-tight">{option.label}</div>
                <div className="text-[#D8B13D] mt-1">{option.multiplier}x</div>
              </button>
            ))}
          </div>

          {/* Duration slider */}
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0"
              max="4"
              value={DURATION_OPTIONS.findIndex((opt) => opt.days === selectedDays)}
              onChange={(e) => setSelectedDays(DURATION_OPTIONS[parseInt(e.target.value)].days)}
              className="flex-1 h-2 bg-[#1a1a20] rounded-lg appearance-none cursor-pointer"
            />
          </div>
          <div className="flex justify-between mt-3 font-sans text-xs text-[#9a9a9a]">
            <span>30</span>
            <span>90</span>
            <span>180</span>
            <span>365</span>
            <span>730</span>
          </div>
        </div>

        {/* 3. Stake Preview */}
        <div className="mb-8 border border-[rgba(255,255,255,0.08)] rounded-lg p-6 bg-[#0a0a0c]">
          <h3 className="font-sans text-sm font-semibold text-[#9a9a9a] mb-4 uppercase tracking-wide">
            3. Stake Preview
          </h3>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            <div>
              <p className="font-sans text-xs text-[#9a9a9a] mb-1">TIER</p>
              <p className="font-sans font-semibold text-[#D8B13D]">{selectedOption?.tier}</p>
            </div>
            <div>
              <p className="font-sans text-xs text-[#9a9a9a] mb-1">MULTIPLIER</p>
              <p className="font-sans font-semibold text-[#f4f4f4]">{selectedOption?.multiplier}x</p>
            </div>
            <div>
              <p className="font-sans text-xs text-[#9a9a9a] mb-1">FEE REBATE</p>
              <p className="font-sans font-semibold text-[#f4f4f4]">{selectedOption?.feeRebate}%</p>
            </div>
            <div>
              <p className="font-sans text-xs text-[#9a9a9a] mb-1">EST. APY</p>
              <p className="font-sans font-semibold text-[#10b981]">{estimatedAPY}%</p>
            </div>
          </div>
        </div>

        {/* Info message */}
        <div className="flex items-start gap-3 mb-8 p-4 bg-[#0a0a0c] border border-[rgba(255,255,255,0.08)] rounded-lg">
          <span className="text-[#D8B13D] font-sans text-lg mt-0.5">ℹ️</span>
          <p className="font-sans text-sm text-[#9a9a9a]">
            You will start earning rewards after your stake is confirmed.
          </p>
        </div>

        {/* Create Stake Button */}
        <button className="w-full bg-[#D8B13D] hover:bg-[#D8B13D]/90 text-black font-sans font-bold py-3 px-6 rounded-lg transition-colors">
          {/* TODO: Connect to contract write function */}
          Create Stake
        </button>
      </div>
    </div>
  )
}
