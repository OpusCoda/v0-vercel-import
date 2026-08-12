'use client'

import { useReadContract } from 'wagmi'
import { formatUnits } from 'viem'
import { STAKING_CONTRACT, STAKING_ABI } from '@/lib/staking'

function fmt(wei: bigint): string {
  return Number(formatUnits(wei, 18)).toLocaleString(undefined, { maximumFractionDigits: 0 })
}

/**
 * Reads previewUnstakePrincipal(stakeId) and shows exactly how much SMAUG
 * principal the user gets back vs. forfeits if they unstake right now.
 * Renders nothing until the read resolves. Purely informational.
 *
 * `returned` / `forfeited` come straight from the contract's own curve, so
 * this always matches what unstake() will actually pay.
 */
export function UnstakeWarning({ stakeId, isMature }: { stakeId: string; isMature: boolean }) {
  const { data } = useReadContract({
    address: STAKING_CONTRACT as `0x${string}`,
    abi: STAKING_ABI,
    functionName: 'previewUnstakePrincipal',
    args: [BigInt(stakeId)],
  })

  if (!data) return null
  const [returned, forfeited] = data as [bigint, bigint]

  // Nothing forfeited (mature, in grace) — reassure rather than warn.
  if (forfeited === 0n) {
    return (
      <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-3 text-left">
        <p className="font-sans text-xs text-green-400">
          You'll receive your full principal of {fmt(returned)} SMAUG — no early-exit penalty.
        </p>
      </div>
    )
  }

  const total = returned + forfeited
  const forfeitPct = total > 0n ? Number((forfeited * 10000n) / total) / 100 : 0

  return (
    <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-left">
      <p className="mb-2 font-sans text-xs font-semibold text-red-400">
        Early exit — you will forfeit part of your staked SMAUG.
      </p>
      <div className="space-y-1 font-sans text-xs">
        <div className="flex justify-between">
          <span className="text-[#9a9a9a]">You receive</span>
          <span className="font-semibold text-[#f4f4f4]">{fmt(returned)} SMAUG</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#9a9a9a]">You forfeit</span>
          <span className="font-semibold text-red-400">
            {fmt(forfeited)} SMAUG ({forfeitPct.toFixed(1)}%)
          </span>
        </div>
      </div>
      <p className="mt-2 font-sans text-[10px] text-[#7c7a76]">
        The forfeited amount shrinks the closer you get to maturity, reaching zero at the end of your lock. Half of it is burned; half is redistributed to remaining stakers.
      </p>
    </div>
  )
}