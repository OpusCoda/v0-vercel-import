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
// One inline stat: value bold, label muted beside it.
function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex items-baseline gap-1.5 whitespace-nowrap">
      <span className="font-sans text-sm font-bold text-[#e8e6e3]">{value}</span>
      <span className="font-sans text-[10px] uppercase tracking-wider text-[#7c7a76]">{label}</span>
    </div>
  )
}
// Thin vertical divider between stat groups.
function Divider() {
  return <span className="hidden h-4 w-px shrink-0 bg-[#2a2a35] sm:block" />
}
export function PlatformOverview() {
  const { markets } = useAllMarkets()
  const wager = useWagerMarketStats()
  const pm = usePredictionMarketStats()
  const { pmOpen, pmVolume } = useMemo(() => {
    const now = BigInt(Math.floor(Date.now() / 1000))
    let open = 0
    let vol = 0n
    for (const e of markets) {
      const m = e.market
      if (!m.resolved && !m.voided && now < m.bettingDeadline) open++
      vol += m.totalVolume
    }
    return { pmOpen: open, pmVolume: vol }
  }, [markets])
  const shopVolume = pm.cumulativeVolume > 0n ? pm.cumulativeVolume : pmVolume
  const combinedVolume = shopVolume + wager.totalVolume
  const combinedOpen = pmOpen + Number(wager.openWagerCount)
  const wagerCompleted = wager.totalResolved + wager.totalVoided
  return (
    <div className="mb-6 rounded-xl border border-[#2a2a35] bg-[#101017] px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {/* Combined — lead group, gold accent */}
        <span className="font-serif text-xs font-semibold text-[#d4af37]">Platform</span>
        <Stat value={fmtPls(combinedVolume)} label="PLS Vol" />
        <Stat value={fmtCount(combinedOpen)} label="Open" />
        <Divider />
        {/* Probability Shop */}
        <span className="font-sans text-[10px] font-semibold text-[#b8b6b1]">Shop</span>
        <Stat value={fmtPls(shopVolume)} label="Vol" />
        <Stat value={fmtCount(pmOpen)} label="Open" />
        <Stat value={fmtCount(pm.resolvedMarketCount)} label="Resolved" />
        <Divider />
        {/* Outcome Exchange */}
        <span className="font-sans text-[10px] font-semibold text-[#b8b6b1]">Exchange</span>
        <Stat value={fmtPls(wager.totalVolume)} label="Vol" />
        <Stat value={fmtCount(wager.openWagerCount)} label="Open" />
        <Stat value={fmtCount(wagerCompleted)} label="Done" />
      </div>
    </div>
  )
}