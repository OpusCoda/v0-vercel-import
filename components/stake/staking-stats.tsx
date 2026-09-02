'use client'

import { useMemo } from 'react'
import { useAccount, useReadContract, useReadContracts } from 'wagmi'
import {
  STAKING_CONTRACT,
  STAKING_ABI,
  SMAUG_TOKEN,
  SMAUG_SUPPLY_ABI,
  formatSmaugBalance,
} from '@/lib/staking'

const TIER_NAMES = ['Hatchling', 'Drake', 'Dragon', 'Elder Dragon', 'Smaug']

const staking = {
  address: STAKING_CONTRACT as `0x${string}`,
  abi: STAKING_ABI,
} as const

function StatBox({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string
  sub?: string
  accent?: boolean
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111116] p-5">
      <p className="font-sans text-xs uppercase tracking-wide text-[#9a9a9a]">{label}</p>
      <p
        className={`mt-2 font-serif text-2xl font-bold ${accent ? 'text-[#B87333]' : 'text-[#f4f4f4]'
          }`}
      >
        {value}
      </p>
      {sub && <p className="mt-1 font-sans text-xs text-[#7c7a76]">{sub}</p>}
    </div>
  )
}

export function StakingStats() {
  const { address } = useAccount()

  // ── Protocol-wide reads ───────────────────────────────────────────────────
  const { data: totalStaked } = useReadContract({ ...staking, functionName: 'totalStaked' })
  const { data: totalStakers } = useReadContract({ ...staking, functionName: 'totalStakers' })
  const { data: totalWeighted } = useReadContract({
    ...staking,
    functionName: 'totalWeightedStake',
  })
  const { data: plsDistributed } = useReadContract({
    ...staking,
    functionName: 'plsTotalDistributed',
  })
  const { data: smaugDistributed } = useReadContract({
    ...staking,
    functionName: 'smaugTotalDistributed',
  })
  const { data: burnReserve } = useReadContract({ ...staking, functionName: 'smaugBurnReserve' })

  // Circulating supply comes from the SMAUG token (total minus burned).
  const { data: circulating } = useReadContract({
    address: SMAUG_TOKEN as `0x${string}`,
    abi: SMAUG_SUPPLY_ABI,
    functionName: 'getCirculatingSupply',
  })

  // ── Per-wallet reads ──────────────────────────────────────────────────────
  const { data: userStakeIds } = useReadContract({
    ...staking,
    functionName: 'getUserStakeIds',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  const { data: rebateBps } = useReadContract({
    ...staking,
    functionName: 'stakingRebateBps',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  const { data: userPending } = useReadContract({
    ...staking,
    functionName: 'totalPendingByUser',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 30000 },
  })

  const ids = (userStakeIds as bigint[] | undefined) ?? []

  // Batch-read each of the user's stakes so we can total their principal and
  // weighted amount (the contract has no per-user aggregate for these).
  const { data: stakeRows } = useReadContracts({
    contracts: ids.map((id) => ({
      ...staking,
      functionName: 'stakes' as const,
      args: [id] as const,
    })),
    query: { enabled: ids.length > 0 },
  })

  const userTotals = useMemo(() => {
    let principal = 0n
    let weighted = 0n
    let bestTier = -1
    if (stakeRows) {
      for (const row of stakeRows) {
        if (row.status !== 'success' || !row.result) continue
        const r = row.result as unknown as readonly [
          string,
          bigint,
          bigint,
          bigint,
          bigint,
          bigint,
        ]
        principal += r[1]
        weighted += r[5]
        const tier = Number(r[4])
        if (tier > bestTier) bestTier = tier
      }
    }
    return { principal, weighted, bestTier }
  }, [stakeRows])

  // ── Derived figures ───────────────────────────────────────────────────────
  const pctOfSupply =
    totalStaked !== undefined && circulating !== undefined && circulating > 0n
      ? (Number(totalStaked) / Number(circulating)) * 100
      : undefined

  const weightShare =
    totalWeighted !== undefined && totalWeighted > 0n && userTotals.weighted > 0n
      ? (Number(userTotals.weighted) / Number(totalWeighted)) * 100
      : undefined

  const plsPending = userPending ? (userPending as readonly bigint[])[0] : undefined
  const smaugPending = userPending ? (userPending as readonly bigint[])[1] : undefined

  const connected = Boolean(address)
  const hasStakes = ids.length > 0

  return (
    <div className="space-y-6">
      {/* ── Protocol stats ─────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatBox
          label="Total staked"
          value={
    totalStaked !== undefined
      ? `${Math.round(Number(totalStaked) / 1e18).toLocaleString()}   SMAUG`
      : '—'
    }
          sub={
            pctOfSupply !== undefined
              ? `${pctOfSupply.toFixed(2)}% of circulating supply`
              : undefined
          }
        />
        <StatBox
          label="Stakers"
          value={totalStakers !== undefined ? totalStakers.toString() : '—'}
          sub="Wallets with at least one active stake"
        />
        <StatBox
          label="PLS paid to stakers"
          value={
            plsDistributed !== undefined ? `${formatSmaugBalance(plsDistributed)} PLS` : '—'
          }
          sub="Cumulative — includes unclaimed"
          accent
        />
        <StatBox
          label="SMAUG paid to stakers"
          value={
            smaugDistributed !== undefined
              ? `${formatSmaugBalance(smaugDistributed)} SMAUG`
              : '—'
          }
          sub="Rewards only — excludes reflections"
          accent
        />
      </div>

      {/* Deflation stat — only meaningful once burns start accruing. */}
      {burnReserve !== undefined && burnReserve > 0n && (
        <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4">
          <p className="font-sans text-xs text-[#9a9a9a]">
            Awaiting burn:{' '}
            <span className="font-semibold text-orange-400">
              {formatSmaugBalance(burnReserve)} SMAUG
            </span>{' '}
            — forfeited principal queued for permanent removal from supply.
          </p>
        </div>
      )}

      {/* ── Your position ──────────────────────────────────────────────── */}
      {connected && hasStakes && (
        <div className="rounded-2xl border border-white/10 bg-[#111116] p-5">
          <h3 className="mb-4 font-serif text-lg font-semibold text-[#f4f4f4]">Your position</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="font-sans text-xs uppercase tracking-wide text-[#9a9a9a]">
                Your stake
              </p>
              <p className="mt-1 font-sans text-lg font-semibold text-[#f4f4f4]">
                {formatSmaugBalance(userTotals.principal)} SMAUG
              </p>
              <p className="font-sans text-xs text-[#7c7a76]">
                {ids.length} active stake{ids.length === 1 ? '' : 's'}
              </p>
            </div>
            <div>
              <p className="font-sans text-xs uppercase tracking-wide text-[#9a9a9a]">
                Share of rewards
              </p>
              <p className="mt-1 font-sans text-lg font-semibold text-[#B87333]">
                {weightShare !== undefined ? `${weightShare.toFixed(2)}%` : '—'}
              </p>
              <p className="font-sans text-xs text-[#7c7a76]">
                Your slice of every distribution
              </p>
            </div>
            <div>
              <p className="font-sans text-xs uppercase tracking-wide text-[#9a9a9a]">
                Fee rebate
              </p>
              <p className="mt-1 font-sans text-lg font-semibold text-[#B87333]">
                {rebateBps !== undefined ? `${Number(rebateBps) / 100}%` : '—'}
              </p>
              <p className="font-sans text-xs text-[#7c7a76]">
                {userTotals.bestTier >= 0
                  ? `${TIER_NAMES[userTotals.bestTier]} tier — applies in both markets`
                  : 'Applies in both markets'}
              </p>
            </div>
            <div>
              <p className="font-sans text-xs uppercase tracking-wide text-[#9a9a9a]">
                Pending rewards
              </p>
              <p className="mt-1 font-sans text-lg font-semibold text-[#B87333]">
                {plsPending !== undefined ? formatSmaugBalance(plsPending) : '—'} PLS
              </p>
              <p className="font-sans text-xs text-[#7c7a76]">
                {smaugPending !== undefined ? formatSmaugBalance(smaugPending) : '—'} SMAUG
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Honest framing where an APR box used to sit. */}
      <p className="font-sans text-xs leading-relaxed text-[#7c7a76]">
        Staking rewards come from protocol fees, not from a fixed emission rate, so there is no
        fixed APR. Your share of every distribution is set by your weighted stake — amount ×
        duration multiplier (1x at 30 days rising to 5x at 730 days). The figures above are read
        live from the contract.
      </p>
    </div>
  )
}