'use client'

import { useState } from 'react'
import { useReadContract, useWriteContract } from 'wagmi'
import { useStakeDetails, usePendingReward, getMaturityInfo, formatDate } from '@/hooks/useStakeDetails'
import { formatSmaugBalance, STAKING_CONTRACT, STAKING_ABI } from '@/lib/staking'
import EggIcon from './egg-icon'

const TIERS = ['Hatchling', 'Drake', 'Dragon', 'Elder Dragon', 'Smaug']
const EGG_TIERS: Record<string, 'hatchling' | 'drake' | 'dragon' | 'elder-dragon' | 'smaug'> = {
  'Hatchling': 'hatchling',
  'Drake': 'drake',
  'Dragon': 'dragon',
  'Elder Dragon': 'elder-dragon',
  'Smaug': 'smaug',
}

const PLS_ADDRESS = '0x0000000000000000000000000000000000000000'
const SMAUG_ADDRESS = '0xf4754Aa585caBf38537A68660469A17E203D8632'

interface StakeRowProps {
  stakeId: string
  contractSmaugBalance: bigint
  totalWeightedStakeRaw: bigint
  totalStakedRaw: bigint
}

function StakeRow({ stakeId, contractSmaugBalance, totalWeightedStakeRaw, totalStakedRaw }: StakeRowProps) {
  const stakeDetails = useStakeDetails(stakeId)
  const plsReward = usePendingReward(stakeId, PLS_ADDRESS)
  const smaugReward = usePendingReward(stakeId, SMAUG_ADDRESS)
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

  const { amount, startTime, endTime, tierIndex, multiplier, weightedAmount } = stakeDetails

  const tierName = TIERS[tierIndex] || 'Unknown'
  const eggTier = EGG_TIERS[tierName] || 'hatchling'

  const maturityInfo = getMaturityInfo(startTime, endTime)
  const plsFormatted = formatSmaugBalance(plsReward)
  const smaugFormatted = formatSmaugBalance(smaugReward)
  const amountFormatted = formatSmaugBalance(amount)
  const multiplierFormatted = (() => {
  const val = Number(multiplier) / 100
  return val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)
})()

  const unsweptPool = contractSmaugBalance > totalStakedRaw ? contractSmaugBalance - totalStakedRaw : 0n
  const unsweptReflections = totalWeightedStakeRaw > 0n && unsweptPool > 0n
    ? unsweptPool * weightedAmount / totalWeightedStakeRaw
    : 0n

  return (
    <tr className="hover:bg-[#09090B]">
      <td className="px-6 py-4 text-sm text-[#f4f4f4]">#{stakeId}</td>
      <td className="px-6 py-4 text-sm text-[#f4f4f4]">
        <div>{amountFormatted} SMAUG</div>
      </td>
      <td className="px-6 py-4 text-sm text-[#f4f4f4]">
        <div className="flex items-center gap-2">
          <EggIcon tier={eggTier} />
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
          <div className="text-[#D8B13D] font-semibold">{smaugFormatted} SMAUG</div>
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
                  : `Early exit applies 2× the normal penalty. You keep ${keepPct}% of rewards at double forfeit rate. Principal is returned in full.`}
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
  contractSmaugBalance: bigint
  totalWeightedStakeRaw: bigint
  totalStakedRaw: bigint
}

export default function YourStakes({ 
  userStakeIds = [], 
  isLoading = false,
  contractSmaugBalance,
  totalWeightedStakeRaw,
  totalStakedRaw,
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
                  contractSmaugBalance={contractSmaugBalance}
                  totalWeightedStakeRaw={totalWeightedStakeRaw}
                  totalStakedRaw={totalStakedRaw}
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