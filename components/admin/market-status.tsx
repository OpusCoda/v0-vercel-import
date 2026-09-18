"use client"

import { useMemo } from "react"
import { useReadContract, useReadContracts } from "wagmi"
import { formatUnits } from "viem"
import { predictionMarketAbi } from "@/lib/abis/prediction-market"

const PREDICTION_MARKET_ADDRESS = "0xBeE9e50cF2b522D225b2B2115C0c0F2ce2aFE392"

// Must match the contract constant UNCLAIMED_SWEEP_WINDOW.
const SWEEP_WINDOW_SECONDS = 90n * 24n * 60n * 60n // 90 days

function fmtPls(wei: bigint, dp = 0): string {
  return Number(formatUnits(wei, 18)).toLocaleString(undefined, { maximumFractionDigits: dp })
}

function fmtDaysLeft(secondsLeft: bigint): string {
  const days = Number(secondsLeft) / 86400
  if (days >= 2) return `${Math.ceil(days)}d`
  const hours = Number(secondsLeft) / 3600
  if (hours >= 1) return `${Math.ceil(hours)}h`
  return "<1h"
}

function fmtDate(unixSec: bigint): string {
  if (unixSec === 0n) return "—"
  return new Date(Number(unixSec) * 1000).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function pct(part: bigint, whole: bigint): number {
  if (whole === 0n) return 0
  return Number((part * 10000n) / whole) / 100
}

/**
 * Where a market sits in its lifecycle, from the admin's point of view.
 *
 * Ordered by how much attention it wants: anything actionable sorts to the
 * top of the table.
 */
type Phase =
  | "sweepable" // window passed, funds still unclaimed — owner can sweep
  | "residual" // all winners claimed, creator can reclaim seed liquidity
  | "waiting" // resolved, claiming open, sweep window still running
  | "settled" // nothing left to do
  | "voided"
  | "awaiting" // past betting deadline, not yet resolved
  | "betting"

const PHASE_ORDER: Phase[] = [
  "sweepable",
  "residual",
  "waiting",
  "awaiting",
  "betting",
  "voided",
  "settled",
]

const PHASE_STYLE: Record<Phase, { label: string; className: string }> = {
  sweepable: { label: "Sweepable now", className: "text-[#B87333]" },
  residual: { label: "Residual claimable", className: "text-[#B87333]" },
  waiting: { label: "Claiming open", className: "text-orange-400" },
  settled: { label: "Settled", className: "text-[#7c7a76]" },
  voided: { label: "Voided", className: "text-red-400/80" },
  awaiting: { label: "Awaiting resolution", className: "text-blue-400/80" },
  betting: { label: "Betting open", className: "text-green-400/80" },
}

interface MarketRow {
  marketId: bigint
  question: string
  phase: Phase
  resolvedAt: bigint
  sweepAt: bigint
  settlementPool: bigint
  claimed: bigint
  outstanding: bigint
  remainingBalance: bigint
  totalWinningShares: bigint
  claimedWinningShares: bigint
}

export function MarketStatus() {
  const contract = {
    address: PREDICTION_MARKET_ADDRESS as `0x${string}`,
    abi: predictionMarketAbi,
  } as const

  const { data: countData, isLoading: countLoading } = useReadContract({
    ...contract,
    functionName: "marketCount",
  })

  const count = countData !== undefined ? Number(countData as bigint) : 0

  const calls = useMemo(() => {
    // Typed as any[] to avoid wagmi's deep ABI type-inference blowing the
    // TS instantiation-depth limit (ts2589), matching SweepPanel.
    const c: any[] = []
    for (let i = 0; i < count; i++) {
      c.push({ ...contract, functionName: "getMarket", args: [BigInt(i)] })
      c.push({ ...contract, functionName: "getSettlementInfo", args: [BigInt(i)] })
    }
    return c
  }, [count])

  const { data: reads, isLoading: readsLoading } = useReadContracts({
    contracts: calls,
    allowFailure: true,
    query: { enabled: count > 0, refetchInterval: 60000 },
  })

  const nowSec = BigInt(Math.floor(Date.now() / 1000))

  const rows = useMemo<MarketRow[]>(() => {
    if (!reads) return []

    const results = reads as readonly { status: "success" | "failure"; result?: unknown }[]
    const out: MarketRow[] = []

    for (let i = 0; i < count; i++) {
      const marketRes = results[i * 2]
      const settleRes = results[i * 2 + 1]
      if (marketRes?.status !== "success" || settleRes?.status !== "success") continue

      const m = marketRes.result as {
        question: string
        resolved: boolean
        voided: boolean
        resolvedAt: bigint
        bettingDeadline: bigint
      }

      // getSettlementInfo: settlementPool, remainingSettlementPool,
      // totalWinningShares, claimedWinningShares, remainingMarketBalance,
      // residualClaimable, residualClaimed
      const s = settleRes.result as readonly [bigint, bigint, bigint, bigint, bigint, boolean, boolean]

      const settlementPool = s[0]
      const outstanding = s[1]
      const totalWinningShares = s[2]
      const claimedWinningShares = s[3]
      const remainingBalance = s[4]
      const residualClaimable = s[5]
      const residualClaimed = s[6]

      // The contract tracks what is LEFT, not what has gone out, so claimed is
      // the difference. No event indexing needed.
      const claimed = settlementPool > outstanding ? settlementPool - outstanding : 0n

      const sweepAt = m.resolvedAt + SWEEP_WINDOW_SECONDS

      let phase: Phase
      if (m.voided) {
        phase = "voided"
      } else if (!m.resolved) {
        phase = nowSec >= m.bettingDeadline ? "awaiting" : "betting"
      } else if (residualClaimed || remainingBalance === 0n) {
        phase = "settled"
      } else if (residualClaimable) {
        phase = "residual"
      } else if (nowSec >= sweepAt) {
        phase = "sweepable"
      } else {
        phase = "waiting"
      }

      out.push({
        marketId: BigInt(i),
        question: m.question,
        phase,
        resolvedAt: m.resolvedAt,
        sweepAt,
        settlementPool,
        claimed,
        outstanding,
        remainingBalance,
        totalWinningShares,
        claimedWinningShares,
      })
    }

    // Actionable first, then by market id within each phase.
    out.sort((a, b) => {
      const d = PHASE_ORDER.indexOf(a.phase) - PHASE_ORDER.indexOf(b.phase)
      if (d !== 0) return d
      return Number(a.marketId - b.marketId)
    })

    return out
  }, [reads, count, nowSec])

  const totals = useMemo(() => {
    let pool = 0n
    let claimed = 0n
    let outstanding = 0n
    let sweepableNow = 0n
    let sweepableCount = 0
    let waitingCount = 0

    for (const r of rows) {
      pool += r.settlementPool
      claimed += r.claimed
      outstanding += r.outstanding
      if (r.phase === "sweepable") {
        sweepableNow += r.remainingBalance
        sweepableCount++
      }
      if (r.phase === "waiting") waitingCount++
    }

    return { pool, claimed, outstanding, sweepableNow, sweepableCount, waitingCount }
  }, [rows])

  const isLoading = countLoading || readsLoading

  if (isLoading) {
    return <p className="py-4 font-sans text-sm text-[#7c7a76]">Loading markets…</p>
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-[#2a2a35] bg-[#0d0d12] p-4 text-center">
        <p className="font-sans text-sm text-[#7c7a76]">No markets found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Totals across every market. */}
      <div className="grid grid-cols-2 gap-4 rounded-lg border border-[#2a2a35] bg-[#0d0d12] p-4 sm:grid-cols-4">
        <div>
          <p className="font-sans text-[10px] uppercase tracking-wider text-[#7c7a76]">
            Total settlement pools
          </p>
          <p className="mt-1 font-sans text-lg font-semibold text-[#e8e6e3] tabular-nums">
            {fmtPls(totals.pool)} PLS
          </p>
        </div>
        <div>
          <p className="font-sans text-[10px] uppercase tracking-wider text-[#7c7a76]">Claimed</p>
          <p className="mt-1 font-sans text-lg font-semibold text-green-400 tabular-nums">
            {fmtPls(totals.claimed)} PLS
          </p>
          <p className="font-sans text-[10px] text-[#7c7a76]">
            {pct(totals.claimed, totals.pool).toFixed(1)}% of pools
          </p>
        </div>
        <div>
          <p className="font-sans text-[10px] uppercase tracking-wider text-[#7c7a76]">
            Yet to claim
          </p>
          <p className="mt-1 font-sans text-lg font-semibold text-orange-400 tabular-nums">
            {fmtPls(totals.outstanding)} PLS
          </p>
        </div>
        <div>
          <p className="font-sans text-[10px] uppercase tracking-wider text-[#7c7a76]">
            Sweepable now
          </p>
          <p className="mt-1 font-sans text-lg font-semibold text-[#B87333] tabular-nums">
            {fmtPls(totals.sweepableNow)} PLS
          </p>
          <p className="font-sans text-[10px] text-[#7c7a76]">
            {totals.sweepableCount} market{totals.sweepableCount === 1 ? "" : "s"} ·{" "}
            {totals.waitingCount} in window
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[#2a2a35] bg-[#0d0d12]">
        <table className="w-full min-w-[820px]">
          <thead>
            <tr className="border-b border-[#2a2a35]">
              <th className="px-4 py-3 text-left font-sans text-[11px] font-semibold text-[#7c7a76]">
                #
              </th>
              <th className="px-4 py-3 text-left font-sans text-[11px] font-semibold text-[#7c7a76]">
                Market
              </th>
              <th className="px-4 py-3 text-left font-sans text-[11px] font-semibold text-[#7c7a76]">
                Status
              </th>
              <th className="px-4 py-3 text-right font-sans text-[11px] font-semibold text-[#7c7a76]">
                Pool
              </th>
              <th className="px-4 py-3 text-right font-sans text-[11px] font-semibold text-[#7c7a76]">
                Claimed
              </th>
              <th className="px-4 py-3 text-right font-sans text-[11px] font-semibold text-[#7c7a76]">
                Outstanding
              </th>
              <th className="px-4 py-3 text-right font-sans text-[11px] font-semibold text-[#7c7a76]">
                Winners
              </th>
              <th className="px-4 py-3 text-right font-sans text-[11px] font-semibold text-[#7c7a76]">
                Resolved
              </th>
              <th className="px-4 py-3 text-right font-sans text-[11px] font-semibold text-[#7c7a76]">
                Sweep
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const style = PHASE_STYLE[r.phase]
              const winnersClaimedPct = pct(r.claimedWinningShares, r.totalWinningShares)
              const resolvedPhase =
                r.phase === "sweepable" ||
                r.phase === "residual" ||
                r.phase === "waiting" ||
                r.phase === "settled"

              return (
                <tr
                  key={r.marketId.toString()}
                  className="border-b border-[#2a2a35] transition-colors last:border-b-0 hover:bg-[#0a0a0c]"
                >
                  <td className="px-4 py-3 font-sans text-xs text-[#7c7a76] tabular-nums">
                    {r.marketId.toString()}
                  </td>
                  <td className="max-w-[260px] px-4 py-3">
                    <p className="truncate font-sans text-sm text-[#b8b6b1]" title={r.question}>
                      {r.question}
                    </p>
                  </td>
                  <td className={`px-4 py-3 font-sans text-xs font-semibold ${style.className}`}>
                    {style.label}
                  </td>
                  <td className="px-4 py-3 text-right font-sans text-xs text-[#b8b6b1] tabular-nums">
                    {resolvedPhase ? `${fmtPls(r.settlementPool)}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-sans text-xs tabular-nums">
                    {resolvedPhase ? (
                      <>
                        <span className="text-green-400">{fmtPls(r.claimed)}</span>
                        <span className="ml-1 text-[10px] text-[#7c7a76]">
                          {pct(r.claimed, r.settlementPool).toFixed(0)}%
                        </span>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-sans text-xs tabular-nums">
                    {resolvedPhase ? (
                      <span className={r.outstanding > 0n ? "text-orange-400" : "text-[#7c7a76]"}>
                        {fmtPls(r.outstanding)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-sans text-xs text-[#7c7a76] tabular-nums">
                    {r.totalWinningShares > 0n ? `${winnersClaimedPct.toFixed(0)}% claimed` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-sans text-xs text-[#7c7a76] tabular-nums">
                    {fmtDate(r.resolvedAt)}
                  </td>
                  <td className="px-4 py-3 text-right font-sans text-xs tabular-nums">
                    {r.phase === "waiting" ? (
                      <span className="text-orange-400">
                        in {fmtDaysLeft(r.sweepAt - nowSec)}
                      </span>
                    ) : r.phase === "sweepable" ? (
                      <span className="text-[#B87333]">ready</span>
                    ) : (
                      <span className="text-[#7c7a76]">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="font-sans text-[11px] leading-relaxed text-[#7c7a76]">
        Claimed is derived as settlement pool minus what remains — the contract tracks the
        remainder, not the outflow. &ldquo;Outstanding&rdquo; is winnings not yet claimed;
        &ldquo;Sweepable now&rdquo; means the 90-day window has passed and the remaining balance
        can be forfeited to stakers and dev. Use the Unclaimed Sweeps tab to act on them.
      </p>
    </div>
  )
}