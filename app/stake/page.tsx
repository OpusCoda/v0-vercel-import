'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAccount } from 'wagmi'
import { SiteNav } from '@/components/landing/site-nav'
import { useStakingData } from '@/hooks/useStakingData'
import { useApproveAndStake } from '@/hooks/useApproveAndStake'
import YourStakes from '@/components/stake/your-stakes'
import { STAKING_CONTRACT, STAKING_ABI, SMAUG_TOKEN, ERC20_ABI, parseSmaugAmount } from '@/lib/staking'

export const TIERS = [
  { name: 'Hatchling',    min: 30,  max: 89,  multiplier: 1,   feeRebate: 5,  icon: '🥚' },
  { name: 'Drake',        min: 90,  max: 179, multiplier: 1.5, feeRebate: 10, icon: '🥚' },
  { name: 'Dragon',       min: 180, max: 364, multiplier: 2,   feeRebate: 20, icon: '🥚' },
  { name: 'Elder Dragon', min: 365, max: 729, multiplier: 3,   feeRebate: 30, icon: '🥚' },
  { name: 'Smaug',        min: 730, max: 730, multiplier: 5,   feeRebate: 40, icon: '🥚' },
]

function getTier(days: number) {
  if (!days || days < 30 || days > 730) return null
  return TIERS.find((t) => days >= t.min && days <= t.max) ?? null
}

// Format number with thousands separator
function formatNumberInput(value: string): string {
  const numberOnly = value.replace(/,/g, '')
  if (!numberOnly) return ''
  return parseFloat(numberOnly).toLocaleString('en-US', { maximumFractionDigits: 2 })
}

export default function StakePage() {
  const { address, isConnected } = useAccount()
  const { totalStaked, totalStakers, balance, minStakeAmount, userStakeIds, isLoading, contractSmaugBalance, totalWeightedStakeRaw, totalStakedRaw, refetchStakeIds } = useStakingData()
  const { initiateApproveAndStake, isPending, step, approveTxHash, stakeTxHash } = useApproveAndStake(address)

  const [amount, setAmount] = useState('')
  const [days, setDays] = useState(365)

  const selectedTier = useMemo(() => getTier(days), [days])

  const handleStake = async () => {
    if (!isConnected || !address) {
      return
    }
    if (!amount || parseFloat(amount) <= 0) {
      return
    }
    if (!selectedTier) {
      return
    }

    try {

    const amountBn = parseSmaugAmount(amount.replace(/,/g, ''))
      initiateApproveAndStake(amountBn, days)
      setAmount('')
      setDays(365)
    } catch (err) {
      console.error('[v0] Stake error:', err)
    }
  }

  // Get the numeric minimum stake amount for validation
  const minStakeNum = parseFloat(minStakeAmount.replace(/,/g, '')) || 0
  const amountNum = parseFloat(amount.replace(/,/g, '')) || 0
  const isBelowMinimum = amountNum > 0 && amountNum < minStakeNum

  // Watch for transaction completion
  useEffect(() => {
  if (stakeTxHash && step === 'idle') {
    refetchStakeIds()
  }
  }, [stakeTxHash, step])

  return (
    <>
      <SiteNav />
      <main className="min-h-screen bg-[#09090B] px-6 py-12 text-[#f4f4f4]">
        <div className="mx-auto max-w-7xl space-y-8">

          {/* ── Header ─────────────────────────────────────── */}
          <header className="space-y-6">
            <div>
              <h1 className="font-serif text-5xl font-bold tracking-tight md:text-6xl">
                Stake Smaug
              </h1>
              <p className="mt-3 max-w-xl text-lg text-[#9a9a9a]">
                Lock SMAUG to earn PLS rewards, weighted multipliers, and fee rebates across the ecosystem.
              </p>
            </div>

            {/* Stats strip — single bordered row, no individual cards */}
            <div className="flex divide-x divide-white/10 overflow-hidden rounded-xl border border-white/10 bg-[#111116]">
              {[
                { label: 'Current APR',   value: isLoading ? '—' : '38.42%' },
                { label: 'TVL',           value: isLoading ? '—' : '$183,642' },
                { label: 'Total staked',  value: isLoading ? '—' : `${totalStaked} SMAUG` },
                { label: 'Active stakers',value: isLoading ? '—' : totalStakers.toLocaleString() },
              ].map(({ label, value }) => (
                <div key={label} className="flex-1 px-6 py-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#8f8f8f]">
                    {label}
                  </div>
                  <div className="mt-1 font-serif text-2xl font-bold text-[#D8B13D]">
                    {value}
                  </div>
                </div>
              ))}
            </div>


          </header>

          {/* ── Create + Tiers ─────────────────────────────── */}
          <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">

            {/* Create Stake */}
            <div className="rounded-2xl border border-white/10 bg-[#111116] p-6">
              <h2 className="mb-6 font-serif text-2xl font-bold">Create stake</h2>

              <div className="space-y-5">
                {/* Amount */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#cfcfcf]">
                    Amount <span className="text-xs text-[#7c7a76]">({balance || '0'} SMAUG available)</span>
                  </label>
                  <div className="flex items-center rounded-xl border border-white/10 bg-[#09090B] px-4">
                    <input
                      value={amount}
                      onChange={(e) => setAmount(formatNumberInput(e.target.value))}
                      placeholder="0"
                      className="w-full bg-transparent py-4 text-lg outline-none"
                    />
                    <button
                      onClick={() => setAmount(formatNumberInput(balance))}
                      className="ml-2 rounded-lg px-3 py-2 text-sm font-semibold text-[#D8B13D] hover:bg-[#D8B13D]/10 transition-colors"
                    >
                      Max
                    </button>
                  </div>
                  {isBelowMinimum && (
                    <p className="mt-2 text-sm text-red-400">
                      Min. stake amount is {minStakeAmount} SMAUG
                    </p>
                  )}
                </div>

                {/* Duration */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#cfcfcf]">
                    Duration
                    <span className="ml-2 font-normal text-[#9a9a9a]">
                      — or select a tier →
                    </span>
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
                    <span className="flex items-center px-4 text-sm text-[#9a9a9a]">days</span>
                  </div>

                  {/* Inline tier summary — replaces the heavy Selected Tier card */}
                  <div className="mt-2 h-6">
                    {days < 30 && (
                      <p className="text-sm text-red-400">Minimum duration is 30 days.</p>
                    )}
                    {days > 730 && (
                      <p className="text-sm text-red-400">Maximum duration is 730 days.</p>
                    )}
                    {selectedTier && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-semibold text-[#D8B13D]">{selectedTier.name}</span>
                        <span className="text-[#9a9a9a]">·</span>
                        <span className="text-[#9a9a9a]">{selectedTier.multiplier}× multiplier</span>
                        <span className="text-[#9a9a9a]">·</span>
                        <span className="text-[#9a9a9a]">{selectedTier.feeRebate}% fee rebate</span>
                      </div>
                    )}
                  </div>
                </div>

                {approveTxHash && (step === 'approving' || step === 'staking') && (
   <div className="mt-3 rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm text-blue-400">
    Waiting for SMAUG spending cap approval.
  </div>
)}
  {stakeTxHash && step === 'idle' && (
  <div className="mt-3 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm text-green-400">
    Stake created! Tx: {stakeTxHash.slice(0, 10)}...
  </div>
)}

                <button
                  onClick={handleStake}
                  disabled={!isConnected || isPending || !selectedTier || !amount || isBelowMinimum}
                  className="mt-4 w-full rounded-xl bg-[#D8B13D] px-5 py-4 font-bold text-black transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {!isConnected ? 'Connect wallet' : step === 'approving' ? 'Approving...' : step === 'staking' ? 'Staking...' : 'Create stake'}
                </button>
              </div>
            </div>

            {/* Tier Progression — clickable to set duration */}
            <div className="rounded-2xl border border-white/10 bg-[#111116] p-6">
              <h2 className="font-serif text-2xl font-bold">Tier progression</h2>
              <p className="mb-5 mt-1 text-sm text-[#9a9a9a]">
                Select a tier to set duration automatically.
              </p>

              <div className="space-y-2">
                {TIERS.map((tier) => {
                  const active = selectedTier?.name === tier.name
                  return (
                    <button
                      key={tier.name}
                      onClick={() => setDays(tier.min)}
                      className={`w-full rounded-xl border p-4 text-left transition ${
                        active
                          ? 'border-[#D8B13D] bg-[#D8B13D]/10'
                          : 'border-white/10 bg-[#09090B] hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className={`font-semibold ${active ? 'text-[#D8B13D]' : ''}`}>
                            {tier.icon} {tier.name}
                          </div>
                          <div className="mt-0.5 text-sm text-[#9a9a9a]">
                            {tier.min}
                            {tier.max !== tier.min ? `–${tier.max}` : ''} days
                          </div>
                        </div>
                        <div className="space-y-0.5 text-right text-sm">
                          <div className="font-semibold text-[#D8B13D]">
                            {tier.multiplier}× multiplier
                          </div>
                          <div className="text-[#9a9a9a]">{tier.feeRebate}% fee rebate</div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </section>

          {/* ── Your Stakes ────────────────────────────────── */}
          <section>
            <YourStakes 
  userStakeIds={userStakeIds} 
  isLoading={isLoading}
  contractSmaugBalance={contractSmaugBalance}
  totalWeightedStakeRaw={totalWeightedStakeRaw}
  totalStakedRaw={totalStakedRaw}
/>
          </section>

        </div>
      </main>
    </>
  )
}
