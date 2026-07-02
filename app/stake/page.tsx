'use client'

import { useMemo, useState } from 'react'
import { SiteNav } from '@/components/landing/site-nav'

export const TIERS = [
  { name: 'Hatchling', min: 30, max: 89, multiplier: 1, feeRebate: 5, icon: '🥚' },
  { name: 'Drake', min: 90, max: 179, multiplier: 1.5, feeRebate: 10, icon: '🥚' },
  { name: 'Dragon', min: 180, max: 364, multiplier: 2, feeRebate: 20, icon: '🥚' },
  { name: 'Elder Dragon', min: 365, max: 729, multiplier: 3, feeRebate: 30, icon: '🥚' },
  { name: 'Smaug', min: 730, max: 730, multiplier: 5, feeRebate: 40, icon: '🥚' },
]

function getTier(days: number) {
  if (!days || days < 30) return null
  if (days > 730) return null
  return TIERS.find((tier) => days >= tier.min && days <= tier.max) ?? null
}

export default function StakePage() {
  const [amount, setAmount] = useState('')
  const [days, setDays] = useState(365)

  const selectedTier = useMemo(() => getTier(days), [days])

  return (
    <>
      <SiteNav />
      <main className="min-h-screen bg-[#09090B] px-6 py-12 text-[#f4f4f4]">
        <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-serif text-5xl font-bold tracking-tight md:text-6xl">
              Stake Smaug
            </h1>
            <p className="mt-4 max-w-xl text-lg text-[#9a9a9a]">
              Lock SMAUG to earn boosted rewards, higher multipliers, and fee rebates.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:w-[660px]">
            <Stat label="Current APR" value="38.42%" />
            <Stat label="TVL" value="$183,642" />
            <Stat label="Total Staked" value="52.7M" />
            <Stat label="Active Stakers" value="1,284" />
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div className="rounded-2xl border border-white/10 bg-[#111116] p-6">
            <div className="mb-6">
              <h2 className="font-serif text-3xl font-bold">Create Stake</h2>
              <p className="mt-2 text-sm text-[#9a9a9a]">
                Enter an amount and choose your own duration in days.
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#cfcfcf]">
                  Amount
                </label>
                <div className="flex rounded-xl border border-white/10 bg-[#09090B]">
                  <input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-transparent px-4 py-4 text-lg outline-none"
                  />
                  <span className="flex items-center px-4 text-sm font-semibold text-[#D8B13D]">
                    SMAUG
                  </span>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#cfcfcf]">
                  Stake Duration
                </label>
                <div className="flex rounded-xl border border-white/10 bg-[#09090B]">
                  <input
                    type="number"
                    min={30}
                    max={730}
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                    className="w-full bg-transparent px-4 py-4 text-lg outline-none"
                  />
                  <span className="flex items-center px-4 text-sm text-[#9a9a9a]">
                    days
                  </span>
                </div>

                {days < 30 && (
                  <p className="mt-2 text-sm text-red-400">Minimum duration is 30 days.</p>
                )}

                {days > 730 && (
                  <p className="mt-2 text-sm text-red-400">Maximum duration is 730 days.</p>
                )}
              </div>

              <div className="rounded-xl border border-[#D8B13D]/30 bg-[#D8B13D]/5 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#9a9a9a]">
                  Selected Tier
                </p>

                {selectedTier ? (
                  <div className="mt-3 flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-[#D8B13D]">
                        {selectedTier.icon} {selectedTier.name}
                      </div>
                      <div className="mt-1 text-sm text-[#9a9a9a]">
                        {selectedTier.min}
                        {selectedTier.max !== selectedTier.min ? `–${selectedTier.max}` : ''} days
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xl font-bold">{selectedTier.multiplier}</div>
                      <div className="text-sm text-[#9a9a9a]">
                        {selectedTier.rebate} fee rebate
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-[#9a9a9a]">
                    Enter 30–730 days to activate a tier.
                  </p>
                )}
              </div>

              <button className="w-full rounded-xl bg-[#D8B13D] px-5 py-4 font-bold text-black transition hover:opacity-90">
                Create Stake
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#111116] p-6">
            <h2 className="font-serif text-3xl font-bold">Tier Progression</h2>

            <div className="mt-5 space-y-3">
              {TIERS.map((tier) => {
                const active = selectedTier?.name === tier.name

                return (
                  <div
                    key={tier.name}
                    className={`rounded-xl border p-4 transition ${
                      active
                        ? 'border-[#D8B13D] bg-[#D8B13D]/10'
                        : 'border-white/10 bg-[#09090B]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="font-bold">
                          {tier.icon} {tier.name}
                        </div>
                        <div className="mt-1 text-sm text-[#9a9a9a]">
                          {tier.min}
                          {tier.max !== tier.min ? `–${tier.max}` : ''} days
                        </div>
                      </div>

                      <div className="text-right text-sm">
                        <div className="font-bold text-[#D8B13D]">{tier.multiplier}</div>
                        <div className="text-[#9a9a9a]">{tier.rebate} rebate</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#111116] p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-serif text-3xl font-bold">Your Stakes</h2>
            <button className="rounded-lg border border-white/10 px-4 py-2 text-sm text-[#cfcfcf]">
              Load saved wallets
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-white/10 text-xs uppercase text-[#9a9a9a]">
                <tr>
                  <th className="py-3">Stake</th>
                  <th>Wallet</th>
                  <th>Amount</th>
                  <th>Tier</th>
                  <th>Days Left</th>
                  <th>Progress</th>
                  <th>Rewards</th>
                  <th></th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/10">
                {[
                  ['#41', '0x123...ab12', '50,000 SMAUG', 'Elder Dragon', '214', '41%', '8,214'],
                  ['#52', '0x842...fe91', '20,000 SMAUG', 'Dragon', '88', '63%', '1,983'],
                  ['#71', '0x9ab...441d', '10,000 SMAUG', 'Drake', '51', '44%', '241'],
                ].map((row) => (
                  <tr key={row[0]} className="text-[#f4f4f4]">
                    {row.map((cell, i) => (
                      <td key={i} className="py-4 pr-5 text-nowrap">
                        {cell}
                      </td>
                    ))}
                    <td className="py-4 text-right">
                      <button className="rounded-lg border border-[#D8B13D]/40 px-3 py-1.5 text-sm text-[#D8B13D]">
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        </div>
      </main>
    </>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#111116] p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-[#8f8f8f]">
        {label}
      </div>
      <div className="mt-2 font-serif text-2xl font-bold text-[#D8B13D]">
        {value}
      </div>
    </div>
  )
}
