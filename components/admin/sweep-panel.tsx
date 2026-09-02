"use client"
import { useEffect, useMemo } from "react"
import { useReadContract, useReadContracts } from "wagmi"
import { formatUnits } from "viem"
import { predictionMarketAbi } from "@/lib/abis/prediction-market"
import { useSweepUnclaimed } from "@/hooks/useSweepUnclaimed"
import { useMarketClaim } from "@/hooks/useMarketClaim"
const PREDICTION_MARKET_ADDRESS = "0xBeE9e50cF2b522D225b2B2115C0c0F2ce2aFE392"
// Must match the contract constant UNCLAIMED_SWEEP_WINDOW.
const SWEEP_WINDOW_SECONDS = 90n * 24n * 60n * 60n // 90 days
function fmtPls(wei: bigint, dp = 2): string {
  return Number(formatUnits(wei, 18)).toLocaleString(undefined, { maximumFractionDigits: dp })
}
function fmtDaysLeft(secondsLeft: bigint): string {
  const days = Number(secondsLeft) / 86400
  if (days >= 2) return `${Math.ceil(days)} days`
  const hours = Number(secondsLeft) / 3600
  if (hours >= 1) return `${Math.ceil(hours)} hours`
  return "under an hour"
}
// Per-market settlement snapshot, assembled from getMarket + getSettlementInfo.
interface SweepRow {
  marketId: bigint
  question: string
  resolvedAt: bigint
  remainingBalance: bigint
  remainingSettlementPool: bigint
  totalWinningShares: bigint
  claimedWinningShares: bigint
  residualClaimed: boolean
  residualClaimable: boolean
  sweepAt: bigint // resolvedAt + window
}
// One market's sweep card.
function SweepCard({ row, nowSec, onSwept }: { row: SweepRow; nowSec: bigint; onSwept: () => void }) {
  const { sweep, isPending, isConfirming, isSuccess, writeError } = useSweepUnclaimed()
  const {
    claim,
    isPending: claimPending,
    isConfirming: claimConfirming,
    isSuccess: claimSuccess,
    writeError: claimError,
  } = useMarketClaim()
  useEffect(() => {
    if (isSuccess || claimSuccess) onSwept()
  }, [isSuccess, claimSuccess, onSwept])
  const windowPassed = nowSec >= row.sweepAt
  const hasBalance = row.remainingBalance > 0n
  const alreadySettled = row.residualClaimed
  // Fraction of winning shares still unclaimed — the forfeiture exposure.
  const unclaimedShares = row.totalWinningShares - row.claimedWinningShares
  const unclaimedPct =
    row.totalWinningShares > 0n
      ? Number((unclaimedShares * 10000n) / row.totalWinningShares) / 100
      : 0
  let statusLabel: string
  let statusColor = "text-[#7c7a76]"
  if (alreadySettled) {
    statusLabel = "Settled (swept or residual claimed)"
  } else if (!hasBalance) {
    statusLabel = "Nothing remaining"
  } else if (!windowPassed) {
    statusLabel = `Sweepable in ${fmtDaysLeft(row.sweepAt - nowSec)}`
    statusColor = "text-orange-400"
  } else {
    statusLabel = "Ready to sweep"
    statusColor = "text-[#B87333]"
  }
  const canSweep = windowPassed && hasBalance && !alreadySettled
  const stakerShare = row.remainingBalance / 2n
  const devShare = row.remainingBalance - stakerShare
  let btnLabel = "Sweep unclaimed"
  if (isSuccess) btnLabel = "Swept ✓"
  else if (isPending) btnLabel = "Confirm in wallet…"
  else if (isConfirming) btnLabel = "Sweeping…"
  return (
    <div className="rounded-lg border border-[#2a2a35] bg-[#0d0d12] p-4">
      <div className="mb-2 truncate font-sans text-sm font-semibold text-[#e8e6e3]" title={row.question}>
        {row.question}
      </div>
      <div className={`mb-3 font-sans text-[11px] font-semibold ${statusColor}`}>{statusLabel}</div>
      <div className="mb-3 space-y-1">
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-sans text-xs text-[#7c7a76]">Remaining balance</span>
          <span className="font-sans text-sm font-semibold text-[#e8e6e3]">
            {fmtPls(row.remainingBalance)} PLS
          </span>
        </div>
        {row.remainingSettlementPool > 0n && (
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-sans text-xs text-[#7c7a76]">Unclaimed winnings</span>
            <span className="font-sans text-sm font-semibold text-orange-400">
              {fmtPls(row.remainingSettlementPool)} PLS
            </span>
          </div>
        )}
        {row.totalWinningShares > 0n && (
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-sans text-xs text-[#7c7a76]">Winners unclaimed</span>
            <span className={`font-sans text-xs font-semibold ${unclaimedPct > 0 ? "text-orange-400" : "text-green-400"}`}>
              {unclaimedPct.toFixed(1)}% of winning shares
            </span>
          </div>
        )}
      </div>
      {canSweep && (
        <div className="mb-2 rounded border border-orange-400/20 bg-orange-400/5 px-2 py-1.5">
          <p className="font-sans text-[10px] leading-relaxed text-[#b8b6b1]">
            Sweeping forfeits {unclaimedPct.toFixed(1)}% of winning shares still unclaimed. Splits{" "}
            <span className="text-[#B87333]">{fmtPls(stakerShare)} PLS</span> to stakers and{" "}
            <span className="text-[#B87333]">{fmtPls(devShare)} PLS</span> to dev.
          </p>
        </div>
      )}
      {row.residualClaimable ? (
        <>
          <div className="mb-2 rounded border border-[#B87333]/20 bg-[#B87333]/5 px-2 py-1.5">
            <p className="font-sans text-[10px] leading-relaxed text-[#b8b6b1]">
              All winners have claimed. The market creator can now reclaim the remaining{" "}
              <span className="text-[#B87333]">{fmtPls(row.remainingBalance)} PLS</span> of seed
              liquidity. (Callable by the market creator only.)
            </p>
          </div>
          <button
            onClick={() => claim(row.marketId, "residual")}
            disabled={claimPending || claimConfirming || claimSuccess}
            className="w-full rounded border border-[#B87333]/30 bg-[#1a1a20] py-1.5 font-sans text-xs font-semibold text-[#B87333] transition-colors hover:bg-[#2a2a35] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {claimSuccess ? "Residual claimed ✓" : claimPending ? "Confirm in wallet…" : claimConfirming ? "Claiming…" : "Claim residual liquidity"}
          </button>
          {claimError && (
            <p className="mt-1.5 font-sans text-[10px] text-red-400">Claim failed — see wallet / console.</p>
          )}
        </>
      ) : (
        <>
          <button
            onClick={() => sweep(row.marketId)}
            disabled={!canSweep || isPending || isConfirming || isSuccess}
            className="w-full rounded border border-[#B87333]/30 bg-[#1a1a20] py-1.5 font-sans text-xs font-semibold text-[#B87333] transition-colors hover:bg-[#2a2a35] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {alreadySettled ? "Settled" : !hasBalance ? "Nothing to sweep" : btnLabel}
          </button>
          {writeError && (
            <p className="mt-1.5 font-sans text-[10px] text-red-400">Sweep failed — see wallet / console.</p>
          )}
        </>
      )}
    </div>
  )
}
/**
 * Owner-only panel to sweep unclaimed funds from resolved markets after the
 * 90-day window. Gate this behind the same owner check as the revenue panel.
 * Reads marketCount, then getMarket + getSettlementInfo per market; surfaces
 * only resolved (non-voided) markets that still hold a balance.
 */
export function SweepPanel() {
  const contract = {
    address: PREDICTION_MARKET_ADDRESS as `0x${string}`,
    abi: predictionMarketAbi,
  } as const
  const { data: countData, isLoading: countLoading } = useReadContract({
    ...contract,
    functionName: "marketCount",
  })
  const count = countData !== undefined ? Number(countData as bigint) : 0
  // getMarket + getSettlementInfo per market.
  const calls = useMemo(() => {
    const c = []
    for (let i = 0; i < count; i++) {
      c.push({ ...contract, functionName: "getMarket", args: [BigInt(i)] })
      c.push({ ...contract, functionName: "getSettlementInfo", args: [BigInt(i)] })
    }
    return c
  }, [count])
  const {
    data: reads,
    isLoading: readsLoading,
    refetch,
  } = useReadContracts({
    contracts: calls,
    allowFailure: true,
    query: { enabled: count > 0, refetchInterval: 60000 },
  })
  const rows = useMemo<SweepRow[]>(() => {
    if (!reads) return []
    const results = reads as readonly {
      status: "success" | "failure"
      result?: unknown
    }[]
    const out: SweepRow[] = []
    for (let i = 0; i < count; i++) {
      const marketRes = results[i * 2]
      const settleRes = results[i * 2 + 1]
      if (marketRes?.status !== "success" || settleRes?.status !== "success") continue
      const m = marketRes.result as {
        question: string
        resolved: boolean
        voided: boolean
        resolvedAt: bigint
      }
      // Only resolved, non-voided markets can be swept.
      if (!m.resolved || m.voided) continue
      const s = settleRes.result as readonly [
        bigint, bigint, bigint, bigint, bigint, boolean, boolean
      ]
      // getSettlementInfo: settlementPool, remainingSettlementPool,
      // totalWinningShares, claimedWinningShares, remainingMarketBalance,
      // residualClaimable, residualClaimed
      const remainingSettlementPool = s[1]
      const remainingBalance = s[4]
      const residualClaimable = s[5]
      const residualClaimed = s[6]
      // Skip markets with nothing left AND already settled — no action possible.
      if (remainingBalance === 0n && residualClaimed) continue
      out.push({
        marketId: BigInt(i),
        question: m.question,
        resolvedAt: m.resolvedAt,
        remainingBalance,
        remainingSettlementPool,
        totalWinningShares: s[2],
        claimedWinningShares: s[3],
        residualClaimed,
        residualClaimable,
        sweepAt: m.resolvedAt + SWEEP_WINDOW_SECONDS,
      })
    }
    return out
  }, [reads, count])
  const nowSec = BigInt(Math.floor(Date.now() / 1000))
  const isLoading = countLoading || readsLoading
  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-1 font-serif text-sm font-semibold text-[#B87333]">Unclaimed sweeps</h3>
        <p className="font-sans text-[11px] leading-relaxed text-[#7c7a76]">
          After a market has been resolved for 90 days, you can sweep any funds winners never
          claimed. The swept amount is split 50% to stakers and 50% to dev. Winners forfeit their
          unclaimed share. This is a forfeiture action — check the unclaimed percentage before sweeping.
        </p>
      </div>
      {isLoading ? (
        <p className="py-4 font-sans text-sm text-[#7c7a76]">Loading resolved markets…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border border-[#2a2a35] bg-[#0d0d12] p-4 text-center">
          <p className="font-sans text-sm text-[#7c7a76]">
            No resolved markets with a remaining balance.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {rows.map((row) => (
            <SweepCard key={row.marketId.toString()} row={row} nowSec={nowSec} onSwept={refetch} />
          ))}
        </div>
      )}
    </div>
  )
}