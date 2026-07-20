'use client'
import Image from 'next/image'
import { useState } from 'react'
import { useReadContract, useWriteContract, useAccount } from 'wagmi'
import { useStakeDetails, usePendingPLS, usePendingSmaugReward, usePendingSmaugReflection, getMaturityInfo, formatDate } from '@/hooks/useStakeDetails'
import { formatSmaugBalance, STAKING_CONTRACT, STAKING_ABI } from '@/lib/staking'
import { useClaimedRewards } from '@/hooks/useClaimedRewards'
import { useCompletedStakes } from '@/hooks/useCompletedStakes'
const TIERS = ['Hatchling', 'Drake', 'Dragon', 'Elder Dragon', 'Smaug']
const TIER_IMAGES: Record<string, string> = {
  'Hatchling': '/tiers/hatchling.png',
  'Drake': '/tiers/drake.png',
  'Dragon': '/tiers/dragon.png',
  'Elder Dragon': '/tiers/elder-dragon.png',
  'Smaug': '/tiers/smaug.png',
}
const TIER_MULTIPLIERS = ['1', '1.5', '2', '3', '5']
interface StakeRowProps {
  stakeId: string
}
function StakeRow({ stakeId }: StakeRowProps) {
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
        <td colSpan={8} className="px-6 py-4 text-center text-sm text-[#9a9a9a]">
          Loading stake details...
        </td>
      </tr>
    )
  }
  // Unstaked stakes are deleted on-chain (amount 0) — don't render as active rows.
  if (stakeDetails.amount === 0n) return null
  const { amount, startTime, endTime, tierIndex, weightedAmount } = stakeDetails
  const multiplierFormatted = (() => {
  if (!multiplierData) return TIER_MULTIPLIERS[tierIndex] || '1'
  const val = Number(multiplierData) / 100
  return val % 1 === 0 ? val.toFixed(0) : val.toFixed(2)
})()
  const tierName = TIERS[tierIndex] || 'Unknown'
  const tierImagePath = TIER_IMAGES[tierName] || TIER_IMAGES['Hatchling']
  const maturityInfo = getMaturityInfo(startTime, endTime)
  const plsFormatted = formatSmaugBalance(plsReward)
  const totalSmaugFormatted = formatSmaugBalance(smaugReward + reflectionReward)
  const amountFormatted = formatSmaugBalance(amount)
  return (
    <tr className="hover:bg-[#09090B]">
      <td className="px-6 py-4 text-sm text-[#f4f4f4]">#{stakeId}</td>
      <td className="px-6 py-4 text-sm text-[#f4f4f4]">
        <div>{amountFormatted} SMAUG</div>
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
          <div className="text-[#D8B13D] font-semibold">{plsFormatted} PLS</div>
          <div className="text-[#D8B13D] font-semibold">{totalSmaugFormatted} SMAUG</div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm">
        <div className="space-y-1">
          <div className="text-[#6ea8fe]">{formatSmaugBalance(claimed.plsKept)} PLS</div>
          <div className="text-[#6ea8fe]">{formatSmaugBalance(claimed.smaugKept)} SMAUG</div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm">
        <div className="space-y-1">
          <div className="text-[#8a8a8a]">{formatSmaugBalance(claimed.plsForfeited)} PLS</div>
          <div className="text-[#8a8a8a]">{formatSmaugBalance(claimed.smaugForfeited)} SMAUG</div>
        </div>
      </td>
      <td className="px-6 py-4 text-right">
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
                  className="rounded-lg border border-[#D8B13D]/40 px-3 py-1.5 text-xs font-semibold text-[#D8B13D] hover:bg-[#D8B13D]/10 transition-colors disabled:opacity-50"
                >
                  {isPending ? 'Claiming...' : 'Confirm'}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => isMature ? handleClaim() : setShowConfirm(true)}
              disabled={isPending}
              className="w-full rounded-lg border border-[#D8B13D]/40 px-3 py-1.5 text-sm font-semibold text-[#D8B13D] hover:bg-[#D8B13D]/10 transition-colors disabled:opacity-50"
            >
              {isPending ? 'Claiming...' : 'Claim rewards'}
            </button>
          )}
          {/* End stake */}
          {showUnstakeConfirm ? (
            <div className="space-y-2 text-right">
              <div className={inBurnPhase ? "text-xs text-orange-400" : isMature ? "text-xs text-green-400" : "text-xs text-red-400"}>
                {inBurnPhase
                  ? 'Returns remaining principal and rewards.'
                  : isMature
                  ? 'Matured — returns your principal and all rewards, no penalty.'
                  : `You keep ${keepPct}% of rewards. Principal is returned in full.`}
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
              {unstakePending ? 'Ending...' : isMature ? 'End stake (no penalty)' : 'End stake'}
            </button>
          )}
        </div>
      </td>
    </tr>
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
  // Self-fetch active stake IDs (one call, no index probing).
  const { data: stakeIdsData, isLoading } = useReadContract({
    address: STAKING_CONTRACT as `0x${string}`,
    abi: STAKING_ABI,
    functionName: 'getUserStakeIds',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 30000 },
  })
  const userStakeIds = ((stakeIdsData as bigint[]) ?? []).map((id) => id.toString())
  const { completed } = useCompletedStakes()
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111116]">
      <div className="border-b border-white/10 p-6">
        <h2 className="font-serif text-2xl font-bold text-[#f4f4f4]">
          Your Stakes
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] text-left">
          <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-[#9a9a9a]">
            <tr>
              {[
                'Stake ID',
                'Amount',
                'Tier',
                'Maturity',
                'Pending',
                'Claimed',
                'Forfeited',
                'Actions',
              ].map((heading) => (
                <th key={heading} className="px-6 py-4 font-semibold">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {userStakeIds.length > 0 ? (
              userStakeIds.map((stakeId) => (
                <StakeRow
                  key={stakeId}
                  stakeId={stakeId}
                />
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-sm text-[#9a9a9a]">
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