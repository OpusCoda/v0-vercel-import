'use client'

import { useMemo, useState } from 'react'

export const TIERS = [
  { name: 'Hatchling', min: 30, max: 89, multiplier: 1, feeRebate: 5, icon: '🥚' },
  { name: 'Drake', min: 90, max: 179, multiplier: 1.5, feeRebate: 10, icon: '🟢' },
  { name: 'Dragon', min: 180, max: 364, multiplier: 2, feeRebate: 20, icon: '🔵' },
  { name: 'Elder Dragon', min: 365, max: 729, multiplier: 3, feeRebate: 30, icon: '🟣' },
  { name: 'Smaug', min: 730, max: 1095, multiplier: 5, feeRebate: 40, icon: '🟡' },
]

function getTier(days: number) {
  if (days < 30 || days > 1095) return null
  return TIERS.find((tier) => days >= tier.min && days <= tier.max) ?? null
}

interface CreateStakeCardProps {
  balance?: string
  onStake?: (amount: string, days: number) => void
  isLoading?: boolean
}

export default function CreateStakeCard({ balance = '0', onStake, isLoading = false }: CreateStakeCardProps) {
  const [amount, setAmount] = useState('10,000')
  const [days, setDays] = useState(365)

  const tier = useMemo(() => getTier(days), [days])

  const estimatedAPY = tier
    ? (38.42 * tier.multiplier * (1 + tier.feeRebate / 100)).toFixed(2)
    : '0.00'

  return (
    <div className="rounded-2xl border border-white/10 bg-[#111116] p-6">
      <h2 className="mb-6 font-serif text-2xl font-bold text-[#f4f4f4]">
        Create New Stake
      </h2>

      <div className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-[#f4f4f4]">
            1. Enter Amount <span className="text-xs text-[#7c7a76]">({balance} SMAUG available)</span>
          </label>

          <div className="flex items-center rounded-xl border border-white/10 bg-[#09090B] px-4">
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-transparent py-4 text-lg text-[#f4f4f4] outline-none"
            />
            <span className="font-semibold text-[#D8B13D]">SMAUG</span>
          </div>

          <div className="mt-2 flex justify-end text-sm">
            <button className="font-semibold text-[#D8B13D] hover:opacity-80">MAX</button>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[#f4f4f4]">
            2. Stake Duration
          </label>

          <div className="flex items-center rounded-xl border border-white/10 bg-[#09090B] px-4">
            <input
              type="number"
              min={30}
              max={1095}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="w-full bg-transparent py-4 text-lg text-[#f4f4f4] outline-none"
            />
            <span className="text-sm text-[#9a9a9a]">days</span>
          </div>

          <p className="mt-2 text-sm text-[#9a9a9a]">
            Minimum 30 days · Maximum 1095 days
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#09090B] p-5">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-[#9a9a9a]">
            3. Stake Preview
          </h3>

          {tier ? (
            <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
              <div>
                <p className="text-xs text-[#9a9a9a]">Your Tier</p>
                <p className="mt-1 font-semibold text-[#D8B13D]">
                  {tier.icon} {tier.name}
                </p>
              </div>

              <div>
                <p className="text-xs text-[#9a9a9a]">Multiplier</p>
                <p className="mt-1 font-semibold text-[#f4f4f4]">
                  {tier.multiplier}x
                </p>
              </div>

              <div>
                <p className="text-xs text-[#9a9a9a]">Fee Rebate</p>
                <p className="mt-1 font-semibold text-[#f4f4f4]">
                  {tier.feeRebate}%
                </p>
              </div>

              <div>
                <p className="text-xs text-[#9a9a9a]">Est. APY</p>
                <p className="mt-1 font-semibold text-emerald-400">
                  {estimatedAPY}%
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-red-400">
              Enter a duration between 30 and 1095 days.
            </p>
          )}
        </div>

        <button 
          onClick={() => onStake?.(amount, days)}
          disabled={isLoading}
          className="w-full rounded-xl bg-[#D8B13D] py-4 font-bold text-black transition hover:bg-[#D8B13D]/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Creating Stake...' : 'Create Stake'}
        </button>
      </div>
    </div>
  )
}
