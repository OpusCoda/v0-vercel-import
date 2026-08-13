'use client'
import Image from 'next/image'
import { useState } from 'react'
import { useReadContract, useWriteContract, useAccount } from 'wagmi'
import { useStakeDetails, usePendingPLS, usePendingSmaugReward, usePendingSmaugReflection, getMaturityInfo, formatDate } from '@/hooks/useStakeDetails'
import { formatSmaugBalance, STAKING_CONTRACT, STAKING_ABI } from '@/lib/staking'
import { UnstakeWarning } from '@/components/stake/unstake-warning'
import { useClaimedRewards } from '@/hooks/useClaimedRewards'
import { useCompletedStakes } from '@/hooks/useCompletedStakes'
import { useSavedWallets } from '@/hooks/useSavedWallets'
const TIERS = ['Hatchling', 'Drake', 'Dragon', 'Elder Dragon', 'Smaug']
const TIER_IMAGES: Record<string, string> = {
  'Hatchling': '/tiers/hatchling.png',
  'Drake': '/tiers/drake.png',
  'Dragon': '/tiers/dragon.png',
  'Elder Dragon': '/tiers/elder-dragon.png',
  'Smaug': '/tiers/smaug.png',
}
const TIER_MULTIPLIERS = ['1', '1.5', '2', '3', '5']

function shortAddr(a: string): string {
  return `${a.slice(0, 6)}…${a.slice(-4)}`
}

interface StakeRowProps {
  stakeId: string
  // When true, this stake belongs to a tracked (watch-only) wallet, not the
  // connected one — render read-only, since claim/unstake require the owner to sign.
  readOnly?: boolean
  owner: string
}
function StakeRow({ stakeId, readOnly = false, owner }: StakeRowProps) {
  const stakeDetails = useStakeDetails(stakeId)
  const plsReward = usePendingPLS(stakeId)
  const smaugReward = usePendingSmaugReward(stakeId)
  const reflectionReward = usePendingSmaugReflection(stakeId)
  const claimed = useClaimedRewards(stakeId)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showUnstakeConfirm, setShowUnstakeConfirm] = useState(false)
  const { writeContract, isPending } = useWriteContract()
  const { writeContract: unstakeWrite, isPending: unstakePending } = useWriteContract()
  const { data: penaltyData } = useReadContract({
    address: STAKING_CONTRACT as `0x${string}`,
    abi: STAKING_ABI,
    functionName: 'estimateClaimPenalty',
    args: [BigInt(stakeId)],
  })
  // BURN_GRACE constant, read from the contract so the UI stays correct across
  // test/production constant changes.
  const { data: burnGraceData } = useReadContract({
    address: STAKING_CONTRACT as `0x${string}`,
    abi: STAKING_ABI,
    functionName: 'BURN_GRACE',
  })
  // Move this hook to top level - must be called unconditionally
  const { data: multiplierData } = useReadContract({
    address: STAKING_CONTRACT as `0x${string}`,
    abi: STAKING_ABI,
    functionName: 'multiplierForDuration',
    args: stakeDetails ? [BigInt(stakeDetails.endTime - stakeDetails.startTime)] : undefined,
    query: { enabled: !!stakeDetails && (stakeDetails.endTime - stakeDetails.startTime) > 0 },
  })
  const keepPct = penaltyData ? Number((penaltyData as [bigint, bigint])[0]) : 100
  const isMature = keepPct === 100
  // A stake past endTime + BURN_GRACE is in the burn phase: its principal is
  // being forfeited over time. It is technically "matured" (no reward penalty),
  // but unstaking will NOT return full principal — so it needs its own state.
  const burnGrace = burnGraceData ? Number(burnGraceData) : 0
  const nowSec = Math.floor(Date.now() / 1000)
  const inBurnPhase = !!stakeDetails && burnGrace > 0 && nowSec >= stakeDetails.endTime + burnGrace
  const handleClaim = () => {
    writeContract({
      address: STAKING_CONTRACT as `0x${string}`,
      abi: STAKING_ABI,
      functionName: 'claimRewards',
      args: [BigInt(stakeId)],
    })
    setShowConfirm(false)
  }
  const handleUnstake = () => {
    unstakeWrite({
      address: STAKING_CONTRACT as `0x${string}`,
      abi: STAKING_ABI,
      functionName: 'unstake',
      args: [BigInt(stakeId)],
    })
    setShowUnstakeConfirm(false)
  }
  if (!stakeDetails) {
    return (
      <tr>
        <td colSpan={6} className="px-6 py-4 text-center text-sm text-[#9a9a9a]">
          Loading stake details...
        </td>
      </tr>
    )
  }
  // Unstaked stakes are deleted on-chain (amount 0) — don't render as active rows.
  if (stakeDetails.amount === 0n) return null
  const { amount, startTime, endTime, tierIndex, weightedAmount } = stakeDetails
  const multiplierFormatted = (() => {
    if (!multiplierData) {
      const fallback = TIER_MULTIPLIERS[tierIndex]
      return fallback ? Number(fallback).toFixed(2) : '1.00'
    }
    return (Number(multiplierData) / 100).toFixed(2)
  })()
  const tierName = TIERS[tierIndex] || 'Unknown'
  const tierImagePath = TIER_IMAGES[tierName] || TIER_IMAGES['Hatchling']
  const maturityInfo = getMaturityInfo(startTime, endTime)
  const plsFormatted = formatSmaugBalance(plsReward)
  const totalSmaugFormatted = formatSmaugBalance(smaugReward + reflectionReward)
  const amountFormatted = formatSmaugBalance(amount)
  return (
    <tr className="hover:bg-[#09090B]">
      <td className="px-6 py-4 text-sm text-[#f4f4f4]">
        <div>{amountFormatted} SMAUG</div>
        <div className="mt-1 font-mono text-xs text-[#7c7a76]" title={owner}>
          {shortAddr(owner)}
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-[#f4f4f4]">
        <div className="flex items-center gap-3">
          <Image
            src={tierImagePath}
            alt={tierName}
            width={48}
            height={48}
            className="rounded-lg"
          />
          <div>
            <div>{tierName}</div>
            <div className="text-xs text-[#9a9a9a]">{multiplierFormatted}x multiplier</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-[#f4f4f4]">
        <div className="space-y-1">
          {inBurnPhase ? (
            <span className="inline-block rounded-full border border-orange-500/40 bg-orange-500/10 px-2 py-0.5 text-xs font-semibold text-orange-400">
              Burn phase
            </span>
          ) : isMature ? (
            <span className="inline-block rounded-full border border-green-500/40 bg-green-500/10 px-2 py-0.5 text-xs font-semibold text-green-400">
              Matured
            </span>
          ) : (
            <div>{maturityInfo}</div>
          )}
          <div className="text-xs text-[#9a9a9a]">Started: {formatDate(startTime)}</div>
          <div className="text-xs text-[#9a9a9a]">Ends: {formatDate(endTime)}</div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm">
        <div className="space-y-1">
          <div className="text-[#B87333] font-semibold">{plsFormatted} PLS</div>
          <div className="text-[#B87333] font-semibold">{totalSmaugFormatted} SMAUG</div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm">
        <div className="space-y-1">
          <div className="text-[#6ea8fe]">{formatSmaugBalance(claimed.plsKept)} PLS</div>
          <div className="text-[#6ea8fe]">{formatSmaugBalance(claimed.smaugKept)} SMAUG</div>
        </div>
      </td>
      <td className="px-6 py-4 text-right">
        {readOnly ? (
          // Watch-only wallet: display stake but no actions — only the owner can sign.
          <span className="font-sans text-xs text-[#7c7a76]">
            Connect this wallet to manage
          </span>
        ) : (
          <div className="space-y-2">
            {/* Claim rewards — reverts on-chain during burn phase, so hide it there */}
            {inBurnPhase ? null : showConfirm ? (
              <div className="space-y-2 text-right">
                <div className="text-xs text-red-400">
                  You will keep {keepPct}% of your rewards.{' '}
                  {100 - keepPct}% will be forfeited.
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-[#9a9a9a] hover:border-white/20 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleClaim}
                    disabled={isPending}
                    className="rounded-lg border border-[#B87333]/40 px-3 py-1.5 text-xs font-semibold text-[#B87333] hover:bg-[#B87333]/10 transition-colors disabled:opacity-50"
                  >
                    {isPending ? 'Claiming...' : 'Confirm'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => isMature ? handleClaim() : setShowConfirm(true)}
                disabled={isPending}
                className="w-full rounded-lg border border-[#B87333]/40 px-3 py-1.5 text-sm font-semibold text-[#B87333] hover:bg-[#B87333]/10 transition-colors disabled:opacity-50"
              >
                {isPending ? 'Claiming...' : 'Claim rewards'}
              </button>
            )}
            {/* End stake */}
            {showUnstakeConfirm ? (
              <div className="space-y-2 text-right">
                {!inBurnPhase && <UnstakeWarning stakeId={stakeId} isMature={isMature} />}
                <div className={inBurnPhase ? "text-xs text-orange-400" : isMature ? "text-xs text-green-400" : "text-xs text-red-400"}>
                  {inBurnPhase
                    ? 'Returns remaining principal and rewards.'
                    : isMature
                      ? 'Matured — returns your principal and all rewards, no penalty.'
                      : `You keep ${keepPct}% of rewards.`}
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowUnstakeConfirm(false)}
                    className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-[#9a9a9a] hover:border-white/20 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUnstake}
                    disabled={unstakePending}
                    className="rounded-lg border border-red-500/40 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                  >
                    {unstakePending ? 'Ending...' : 'Confirm end'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowUnstakeConfirm(true)}
                disabled={unstakePending}
                className={inBurnPhase
                  ? "w-full rounded-lg border border-orange-500/40 px-3 py-1.5 text-sm font-semibold text-orange-400 hover:bg-orange-500/10 transition-colors disabled:opacity-50"
                  : isMature
                    ? "w-full rounded-lg border border-green-500/40 px-3 py-1.5 text-sm font-semibold text-green-400 hover:bg-green-500/10 transition-colors disabled:opacity-50"
                    : "w-full rounded-lg border border-red-500/20 px-3 py-1.5 text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"}
              >
                {unstakePending ? 'Ending...' : inBurnPhase ? 'End stake' : isMature ? 'End stake (no penalty)' : 'End stake'}
              </button>
            )}
          </div>
        )}
      </td>
    </tr>
  )
}

// Renders one wallet's active stakes. Fetches that wallet's stake IDs and maps
// them to rows. `readOnly` marks tracked (non-connected) wallets as view-only.
function WalletStakeRows({ owner, readOnly }: { owner: string; readOnly: boolean }) {
  const { data: idsData } = useReadContract({
    address: STAKING_CONTRACT as `0x${string}`,
    abi: STAKING_ABI,
    functionName: 'getUserStakeIds',
    args: [owner as `0x${string}`],
    query: { refetchInterval: 30000 },
  })
  const ids = ((idsData as bigint[]) ?? []).map((id) => id.toString())
  if (ids.length === 0) return null
  return (
    <>
      {ids.map((stakeId) => (
        <StakeRow key={`${owner}-${stakeId}`} stakeId={stakeId} readOnly={readOnly} owner={owner} />
      ))}
    </>
  )
}

// A completed (unstaked) stake — the on-chain struct is deleted, so we show
// reward history (which survives) plus the principal returned from the event.
function CompletedStakeRow({ stakeId, principalReturned }: { stakeId: string; principalReturned: bigint }) {
  const { data } = useReadContract({
    address: STAKING_CONTRACT as `0x${string}`,
    abi: STAKING_ABI,
    functionName: 'rewardTotalsByStake',
    args: [BigInt(stakeId)],
  })
  const [plsClaimed, smaugClaimed, plsForfeited, smaugForfeited] =
    (data as [bigint, bigint, bigint, bigint]) ?? [0n, 0n, 0n, 0n]
  return (
    <tr className="hover:bg-[#09090B]">
      <td className="px-6 py-4 text-sm text-[#9a9a9a]">#{stakeId}</td>
      <td className="px-6 py-4 text-sm text-[#9a9a9a]">
        {formatSmaugBalance(principalReturned)} SMAUG returned
      </td>
      <td className="px-6 py-4 text-sm">
        <div className="space-y-1">
          <div className="text-[#6ea8fe]">{formatSmaugBalance(plsClaimed)} PLS</div>
          <div className="text-[#6ea8fe]">{formatSmaugBalance(smaugClaimed)} SMAUG</div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm">
        <div className="space-y-1">
          <div className="text-[#8a8a8a]">{formatSmaugBalance(plsForfeited)} PLS</div>
          <div className="text-[#8a8a8a]">{formatSmaugBalance(smaugForfeited)} SMAUG</div>
        </div>
      </td>
    </tr>
  )
}
export default function YourStakes() {
  const { address } = useAccount()
  const { selectedAddresses } = useSavedWallets()

  const connected = address?.toLowerCase()
  // Tracked wallets that are NOT the connected one → rendered read-only.
  // De-dupe and exclude the connected address so it isn't shown twice.
  const trackedReadOnly = Array.from(
    new Set(selectedAddresses.map((a) => a.toLowerCase()))
  ).filter((a) => a !== connected)

  // Connected wallet's own stakes — used for the empty-state check.
  const { data: stakeIdsData, isLoading } = useReadContract({
    address: STAKING_CONTRACT as `0x${string}`,
    abi: STAKING_ABI,
    functionName: 'getUserStakeIds',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 30000 },
  })
  const connectedIds = ((stakeIdsData as bigint[]) ?? []).map((id) => id.toString())
  const nothingToShow = connectedIds.length === 0 && trackedReadOnly.length === 0

  const { completed } = useCompletedStakes()
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111116]">
      <div className="border-b border-white/10 p-6">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-serif text-2xl font-bold text-[#f4f4f4]">
            Your Stakes
          </h2>
          {address && (
            <span className="font-sans text-xs text-[#7c7a76]" title={address}>
              Currently connected: <span className="font-mono">{shortAddr(address)}</span>
            </span>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] text-left">
          <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-[#9a9a9a]">
            <tr>
              {[
                'Amount',
                'Tier',
                'Maturity',
                'Pending',
                'Claimed',
                'Actions',
              ].map((heading) => (
                <th key={heading} className="px-6 py-4 font-semibold">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {/* Connected wallet's stakes — fully actionable */}
            {address && <WalletStakeRows owner={address} readOnly={false} />}
            {/* Tracked wallets' stakes — view-only */}
            {trackedReadOnly.map((addr) => (
              <WalletStakeRows key={addr} owner={addr} readOnly={true} />
            ))}
            {nothingToShow && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm text-[#9a9a9a]">
                  {isLoading ? 'Loading stakes...' : 'No stakes yet. Create your first stake!'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Completed (unstaked) stakes — reward history only */}
      {completed.length > 0 && (
        <div className="border-t border-white/10">
          <div className="p-6 pb-3">
            <h3 className="font-serif text-lg font-semibold text-[#9a9a9a]">Completed Stakes</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left">
              <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-[#9a9a9a]">
                <tr>
                  <th className="px-6 py-4 font-semibold">Stake ID</th>
                  <th className="px-6 py-4 font-semibold">Principal</th>
                  <th className="px-6 py-4 font-semibold">Claimed</th>
                  <th className="px-6 py-4 font-semibold">Forfeited</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {completed.map((c) => (
                  <CompletedStakeRow key={`done-${c.stakeId}`} stakeId={c.stakeId} principalReturned={c.principalReturned} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}