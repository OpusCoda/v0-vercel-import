'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useReadContract, useWriteContract } from 'wagmi'
import { useStakeDetails, usePendingPLS, usePendingSmaugReward, usePendingSmaugReflection, getMaturityInfo, formatDate } from '@/hooks/useStakeDetails'
import { formatSmaugBalance, STAKING_CONTRACT, STAKING_ABI } from '@/lib/staking'

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
          <div>{maturityInfo}</div>
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
      <td className="px-6 py-4 text-right">
        <div className="space-y-2">

          {/* Claim rewards */}
          {showConfirm ? (
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
              <div className="text-xs text-red-400">
                {isMature
                  ? 'This will return your principal and all rewards.'
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
              className="w-full rounded-lg border border-red-500/20 px-3 py-1.5 text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
            >
              {unstakePending ? 'Ending...' : 'End stake'}
            </button>
          )}

        </div>
      </td>
    </tr>
  )
}

interface YourStakesProps {
  userStakeIds: string[]
  isLoading?: boolean
}

export default function YourStakes({
  userStakeIds = [],
  isLoading = false,
}: YourStakesProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111116]">
      <div className="border-b border-white/10 p-6">
        <h2 className="font-serif text-2xl font-bold text-[#f4f4f4]">
          Your Stakes
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left">
          <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-[#9a9a9a]">
            <tr>
              {[
                'Stake ID',
                'Amount',
                'Tier',
                'Maturity',
                'Rewards (PLS / SMAUG)',
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
                <td colSpan={6} className="px-6 py-8 text-center text-sm text-[#9a9a9a]">
                  {isLoading ? 'Loading stakes...' : 'No stakes yet. Create your first stake!'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
