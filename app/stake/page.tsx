'use client'

import { useMemo, useState } from 'react'
import { useAccount, useWriteContract } from 'wagmi'
import { SiteNav } from '@/components/landing/site-nav'
import { useStakingData } from '@/hooks/useStakingData'
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

// Mock stake data — replace with on-chain reads
const MOCK_STAKES = [
  { id: '#41', amount: '50,000', tier: 'Elder Dragon', daysLeft: 214, progress: 41, rewards: '8,214' },
  { id: '#52', amount: '20,000', tier: 'Dragon',       daysLeft: 88,  progress: 63, rewards: '1,983' },
  { id: '#71', amount: '10,000', tier: 'Drake',        daysLeft: 51,  progress: 44, rewards: '241'   },
]

export default function StakePage() {
  const { address, isConnected } = useAccount()
  const { totalStaked, totalStakers, balance, isLoading } = useStakingData()
  const { writeContract, isPending } = useWriteContract()

  const [amount, setAmount] = useState('')
  const [days, setDays] = useState(365)
  const [stakeError, setStakeError] = useState('')
  const [stakeTxHash, setStakeTxHash] = useState('')

  const selectedTier = useMemo(() => getTier(days), [days])

  const handleStake = async () => {
    if (!isConnected || !address) {
      setStakeError('Please connect your wallet')
      return
    }
    if (!amount || parseFloat(amount) <= 0) {
      setStakeError('Please enter a valid amount')
      return
    }
    if (!selectedTier) {
      setStakeError('Please select a valid duration (30-730 days)')
      return
    }

    setStakeError('')
    try {
      const amountBn = parseSmaugAmount(amount)
      // TODO: Check allowance and approve if needed before calling stake
      writeContract(
        {
          address: STAKING_CONTRACT as `0x${string}`,
          abi: STAKING_ABI,
          functionName: 'stake',
          args: [amountBn, BigInt(days * 86400)],
        },
        {
          onSuccess: (hash) => {
            setStakeTxHash(hash)
            setAmount('')
            setDays(365)
          },
          onError: (error) => {
            setStakeError(error?.message || 'Failed to stake')
          },
        }
      )
    } catch (err) {
      setStakeError(err instanceof Error ? err.message : 'Failed to stake')
    }
  }

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

            {/* Your balance section */}
            {isConnected && (
              <div className="rounded-xl border border-white/10 bg-[#09090B] px-6 py-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#9a9a9a]">Available balance:</span>
                  <span className="font-serif text-lg font-bold text-[#D8B13D]">
                    {isLoading ? '—' : `${balance} SMAUG`}
                  </span>
                </div>
              </div>
            )}
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

                {stakeError && (
                  <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
                    {stakeError}
                  </div>
                )}

                {stakeTxHash && (
                  <div className="mt-3 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm text-green-400">
                    Stake created! Tx: {stakeTxHash.slice(0, 10)}...
                  </div>
                )}

                <button
                  onClick={handleStake}
                  disabled={!isConnected || isPending || !selectedTier || !amount}
                  className="mt-4 w-full rounded-xl bg-[#D8B13D] px-5 py-4 font-bold text-black transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {!isConnected ? 'Connect wallet' : isPending ? 'Staking...' : 'Create stake'}
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
          <section className="rounded-2xl border border-white/10 bg-[#111116] p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-serif text-2xl font-bold">Your stakes</h2>
              <button className="rounded-lg border border-white/10 px-4 py-2 text-sm text-[#cfcfcf] transition hover:border-white/20">
                Load wallets
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead className="border-b border-white/10 text-xs uppercase text-[#9a9a9a]">
                  <tr>
                    <th className="pb-3">Stake</th>
                    <th className="pb-3">Amount</th>
                    <th className="pb-3">Tier</th>
                    <th className="pb-3">Maturity</th>
                    <th className="pb-3">Rewards</th>
                    <th className="pb-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {MOCK_STAKES.map((row) => (
                    <tr key={row.id} className="text-[#f4f4f4]">
                      <td className="py-4 pr-4 font-mono text-[#9a9a9a]">{row.id}</td>
                      <td className="py-4 pr-4 whitespace-nowrap">{row.amount} SMAUG</td>
                      <td className="py-4 pr-4 whitespace-nowrap">{row.tier}</td>
                      <td className="py-4 pr-6">
                        <div className="flex items-center gap-3">
                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
                            <div
                              className="h-full rounded-full bg-[#D8B13D]"
                              style={{ width: `${row.progress}%` }}
                            />
                          </div>
                          <span className="whitespace-nowrap text-xs text-[#9a9a9a]">
                            {row.daysLeft}d left
                          </span>
                        </div>
                      </td>
                      <td className="py-4 pr-4 whitespace-nowrap font-semibold text-[#D8B13D]">
                        {row.rewards} PLS
                      </td>
                      <td className="py-4">
                        <div className="flex justify-end gap-2">
                          <button className="whitespace-nowrap rounded-lg border border-[#D8B13D]/40 px-3 py-1.5 text-xs text-[#D8B13D] transition hover:bg-[#D8B13D]/10">
                            Claim
                          </button>
                          <button className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-[#cfcfcf] transition hover:border-white/20">
                            Details
                          </button>
                        </div>
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
