'use client'

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { formatUnits } from 'viem'
import { STAKING_CONTRACT, STAKING_ABI } from '@/lib/staking'

function fmt(wei: bigint): string {
  return Number(formatUnits(wei, 18)).toLocaleString(undefined, { maximumFractionDigits: 0 })
}

/**
 * Public "burn forfeited SMAUG" panel. Anyone can trigger burnForfeitedSmaug()
 * once smaugBurnReserve >= minBurnThreshold (the contract reverts below that).
 * Reads are polled so the figure stays live as forfeitures accrue.
 */
export function BurnPanel() {
  const contract = {
    address: STAKING_CONTRACT as `0x${string}`,
    abi: STAKING_ABI,
  } as const

  const { data: reserveData, refetch: refetchReserve } = useReadContract({
    ...contract,
    functionName: 'smaugBurnReserve',
    query: { refetchInterval: 15000 },
  })
  const { data: thresholdData } = useReadContract({
    ...contract,
    functionName: 'minBurnThreshold',
    query: { refetchInterval: 60000 },
  })

  const reserve = (reserveData as bigint) ?? 0n
  const threshold = (thresholdData as bigint) ?? 0n
  const ready = reserve >= threshold && reserve > 0n

  const { data: hash, writeContract, isPending, error } = useWriteContract()
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const handleBurn = () => {
    writeContract({
      ...contract,
      functionName: 'burnForfeitedSmaug',
    })
  }

  // Refresh the reserve after a successful burn (it drops to 0).
  if (isSuccess) refetchReserve()

  return (
    <div className="rounded-2xl border border-orange-500/20 bg-[#111116] p-6">
      <div className="mb-4">
        <h3 className="font-serif text-lg font-semibold text-orange-400">Burn forfeited SMAUG</h3>
        <p className="mt-1 font-sans text-xs text-[#7c7a76]">
          SMAUG forfeited by early and abandoned unstakes collects here — half of every forfeiture. Anyone can send it to the burn address once the threshold is reached.
        </p>
      </div>

      <div className="mb-4 flex items-baseline gap-2">
        <span className="font-serif text-3xl font-bold text-[#f4f4f4]">{fmt(reserve)}</span>
        <span className="font-sans text-sm text-[#9a9a9a]">SMAUG waiting to be burned</span>
      </div>

      {isSuccess ? (
        <p className="font-sans text-sm text-green-400">✓ Burned. The reserve has been sent to the dead address.</p>
      ) : ready ? (
        <button
          onClick={handleBurn}
          disabled={isPending || confirming}
          className="w-full rounded-lg border border-orange-500/40 bg-orange-500/10 py-2.5 font-sans text-sm font-semibold text-orange-400 transition-colors hover:bg-orange-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? 'Confirm in wallet…' : confirming ? 'Burning…' : `Burn ${fmt(reserve)} SMAUG 🔥`}
        </button>
      ) : (
        <div className="rounded-lg border border-[#2a2a35] bg-[#0d0d12] p-3 text-center">
          <p className="font-sans text-xs text-[#7c7a76]">
            Burns unlock at {fmt(threshold)} SMAUG. {reserve > 0n ? `${fmt(threshold - reserve)} more to go.` : 'Nothing forfeited yet.'}
          </p>
        </div>
      )}

      {error && (
        <p className="mt-2 font-sans text-[10px] text-red-400">Transaction failed — see wallet.</p>
      )}
    </div>
  )
}