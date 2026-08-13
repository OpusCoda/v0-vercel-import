"use client"

import { useMemo } from "react"
import { useAccount } from "wagmi"
import { useMyMarketPositions } from "@/hooks/useMyMarketPositions"
import { useAllWagers } from "@/hooks/useAllWagers"

const ZERO = "0x0000000000000000000000000000000000000000"

function plsNum(v: bigint): number {
  return Number(v) / 1e18
}

function fmtPls(v: number): string {
  return v.toLocaleString(undefined, { maximumFractionDigits: 0 }) + " PLS"
}

// Cross-product summary shown above the two positions columns.
// Sources from the same hooks the columns use, so numbers stay consistent.
export function PositionsSummary() {
  const { address, isConnected } = useAccount()
  const { positions, isLoading: posLoading } = useMyMarketPositions()
  const { wagers, isLoading: wagersLoading } = useAllWagers()

  const me = address?.toLowerCase()

  const metrics = useMemo(() => {
    // ── Prediction Shop side ──
    // Current mark-to-market value of live positions + claimable on resolved.
    let predictionValueWei = 0n
    let predictionPnlWei = 0n
    let predictionClaimableWei = 0n
    let openMarketPositions = 0

    for (const p of positions) {
      openMarketPositions++
      for (const s of p.sides) {
        predictionValueWei += s.currentValue
        predictionPnlWei += s.unrealizedPnl
      }
      if (p.claimableAmount > 0n) predictionClaimableWei += p.claimableAmount
    }

    // ── Outcome Exchange side ──
    // Locked principal in active wagers + pending referral is handled in the
    // wager column; here we count locked stake and open positions only.
    let wagerLockedWei = 0n
    let openWagers = 0

    if (me) {
      for (const w of wagers) {
        const isCreator = w.creator.toLowerCase() === me
        const isChallenger = w.challenger.toLowerCase() === me
        if (!isCreator && !isChallenger) continue
        const myStake = isCreator ? w.creatorStake : w.challengerStake
        // Status: 0 Created, 1 Active, 2 Voting, 4 Arbitration → locked & open.
        if (w.status === 0) {
          if (isCreator) {
            wagerLockedWei += myStake
            openWagers++
          }
        } else if (w.status === 1 || w.status === 2 || w.status === 4) {
          wagerLockedWei += myStake
          openWagers++
        }
      }
    }

    const totalValue = plsNum(predictionValueWei + wagerLockedWei)
    const totalClaimable = plsNum(predictionClaimableWei)
    const openPositions = openMarketPositions + openWagers
    const predictionPnl = plsNum(predictionPnlWei)

    return { totalValue, totalClaimable, openPositions, predictionPnl }
  }, [positions, wagers, me])

  if (!isConnected) return null

  const isLoading = posLoading || wagersLoading

  const tiles: { label: string; value: string; hint?: string; tone?: "pnl" }[] = [
    {
      label: "Total value",
      value: isLoading ? "—" : fmtPls(metrics.totalValue),
      hint: "Live prediction value + locked wager stakes",
    },
    {
      label: "Claimable",
      value: isLoading ? "—" : fmtPls(metrics.totalClaimable),
      hint: "Prediction winnings ready to claim",
    },
    {
      label: "Open positions",
      value: isLoading ? "—" : metrics.openPositions.toLocaleString(),
      hint: "Across both markets",
    },
  ]

  return (
    <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-3">
      {tiles.map((t) => {
        const pnlColor =
          t.tone === "pnl" && !isLoading
            ? metrics.predictionPnl > 0
              ? "text-green-400"
              : metrics.predictionPnl < 0
                ? "text-red-400"
                : "text-[#B87333]"
            : "text-[#B87333]"
        return (
          <div
            key={t.label}
            className="rounded-xl border border-[#2a2a35] bg-[#101017] p-4"
            title={t.hint}
          >
            <div className="font-sans text-xs font-semibold uppercase tracking-wide text-[#7c7a76]">
              {t.label}
            </div>
            <div className={`mt-1 font-serif text-2xl font-bold ${pnlColor}`}>
              {t.value}
            </div>
            {t.hint && (
              <div className="mt-1 font-sans text-[10px] text-[#7c7a76]">{t.hint}</div>
            )}
          </div>
        )
      })}
    </div>
  )
}