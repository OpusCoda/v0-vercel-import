"use client"
import { useMemo } from "react"
import { formatUnits } from "viem"
import { useAllMarkets } from "@/hooks/useAllMarkets"
import { useWagerMarketStats } from "@/hooks/useWagerMarketStats"
import { usePredictionMarketStats } from "@/hooks/usePredictionMarketStats"
// Compact PLS formatter: 1.2M, 340K, 5,000.
function fmtPls(wei: bigint): string {
  const n = Number(formatUnits(wei, 18))
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + "B"
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M"
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K"
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 })
}
function fmtCount(n: number | bigint): string {
  return Number(n).toLocaleString()
}
// One stat cell.
function Stat({ label, value, suffix }: { label: string; value: string; suffix?: string }) {
  return (
    <div>
      <div className="mb-1 font-sans text-[10px] font-semibold uppercase tracking-wider text-[#7c7a76]">
        {label}
      </div>
      <div className="flex items-baseline gap-1">
        <div className="font-sans text-lg font-bold text-[#e8e6e3] md:text-xl">{value}</div>
        {suffix && <div className="font-sans text-[10px] text-[#7c7a76]">{suffix}</div>}
      </div>
    </div>
  )
}
export function PlatformOverview() {
  const { markets } = useAllMarkets()
  const wager = useWagerMarketStats()
  const pm = usePredictionMarketStats()
  // Derive Probability Shop open-count + unique traders from the market list.
  const { pmOpen, pmVolume, pmUniqueTraders } = useMemo(() => {
    const now = BigInt(Math.floor(Date.now() / 1000))
    let open = 0
    let vol = 0n
    let traders = 0n
    for (const e of markets) {
      const m = e.market
      if (!m.resolved && !m.voided && now < m.bettingDeadline) open++
      vol += m.totalVolume
      traders += m.uniqueTraders
    }
    return { pmOpen: open, pmVolume: vol, pmUniqueTraders: traders }
  }, [markets])
  // Probability Shop volume: prefer the contract's cumulativeVolume (includes
  // sells), fall back to summed per-market totalVolume if it reads 0.
  const shopVolume = pm.cumulativeVolume > 0n ? pm.cumulativeVolume : pmVolume
  // Combined figures.
  const combinedVolume = shopVolume + wager.totalVolume
  const combinedOpen = pmOpen + Number(wager.openWagerCount)
  // Completed wagers = resolved + voided (both are terminal, off the book).
  const wagerCompleted = wager.totalResolved + wager.totalVoided
  return (
    <div className="mb-8 space-y-4">
      {/* Combined header */}
      <div className="rounded-2xl border border-[#d4af37]/20 bg-[#101017] p-6">
        <h2 className="mb-4 font-serif text-lg font-semibold text-[#d4af37]">Platform Overview</h2>
        <div className="grid grid-cols-3 gap-6">
          <Stat label="Total Volume" value={fmtPls(combinedVolume)} suffix="PLS" />
          <Stat label="Open Markets / Wagers" value={fmtCount(combinedOpen)} />
          <Stat label="Participants" value={fmtCount(pmUniqueTraders)} suffix="traders" />
        </div>
      </div>
      {/* Two per-market columns */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Probability Shop */}
        <div className="rounded-2xl border border-[#2a2a35] bg-[#101017] p-6">
          <h3 className="mb-4 font-serif text-sm font-semibold text-[#d4af37]">Probability Shop</h3>
          <div className="grid grid-cols-3 gap-4">
            <Stat label="Volume" value={fmtPls(shopVolume)} suffix="PLS" />
            <Stat label="Open" value={fmtCount(pmOpen)} suffix="markets" />
            <Stat label="Resolved" value={fmtCount(pm.resolvedMarketCount)} suffix="markets" />
          </div>
        </div>
        {/* Outcome Exchange */}
        <div className="rounded-2xl border border-[#2a2a35] bg-[#101017] p-6">
          <h3 className="mb-4 font-serif text-sm font-semibold text-[#d4af37]">Outcome Exchange</h3>
          <div className="grid grid-cols-3 gap-4">
            <Stat label="Volume" value={fmtPls(wager.totalVolume)} suffix="PLS" />
            <Stat label="Open" value={fmtCount(wager.openWagerCount)} suffix="wagers" />
            <Stat label="Completed" value={fmtCount(wagerCompleted)} suffix="wagers" />
          </div>
        </div>
      </div>
    </div>
  )
}