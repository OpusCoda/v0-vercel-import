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
// A compact stat: value over a muted label. Zero values are dimmed so
// populated numbers carry the eye.
function Stat({ value, label, zero }: { value: string; label: string; zero?: boolean }) {
  return (
    <div className="flex flex-col leading-tight">
      <span className={`font-sans text-sm font-bold ${zero ? "text-[#57565a]" : "text-[#e8e6e3]"}`}>
        {value}
      </span>
      <span className="font-sans text-[9px] uppercase tracking-wider text-[#7c7a76]">{label}</span>
    </div>
  )
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
  const oeVolZero = wager.totalVolume === 0n
  const oeOpenZero = wager.openWagerCount === 0n
  const oeDoneZero = wagerCompleted === 0n
  return (
    <div className="mb-6 flex flex-wrap items-stretch gap-3">
      {/* Hero — combined platform total */}
      <div className="flex items-center gap-4 rounded-xl border border-[#B87333]/25 bg-gradient-to-br from-[#B87333]/[0.06] to-transparent px-5 py-3">
        <div className="flex flex-col leading-tight">
          <span className="font-serif text-[10px] font-semibold uppercase tracking-wider text-[#B87333]">
            Platform
          </span>
          <span className="font-sans text-xl font-bold text-[#e8e6e3]">
            {fmtPls(combinedVolume)}
            <span className="ml-1 font-sans text-[10px] font-medium uppercase text-[#7c7a76]">PLS Vol</span>
          </span>
        </div>
        <div className="h-8 w-px bg-[#B87333]/15" />
        <Stat value={fmtCount(combinedOpen)} label="Open" />
      </div>
      {/* Probability Shop segment */}
      <div className="flex items-center gap-4 rounded-xl border border-[#2a2a35] bg-[#101017] px-5 py-3">
        <span className="font-sans text-[10px] font-semibold uppercase tracking-wider text-[#b8b6b1]">
          Probability Shop
        </span>
        <Stat value={fmtPls(shopVolume)} label="Vol" />
        <Stat value={fmtCount(pmOpen)} label="Open" zero={pmOpen === 0} />
        <Stat value={fmtCount(pm.resolvedMarketCount)} label="Resolved" zero={pm.resolvedMarketCount === 0n} />
      </div>
      {/* Outcome Exchange segment */}
      <div className="flex items-center gap-4 rounded-xl border border-[#2a2a35] bg-[#101017] px-5 py-3">
        <span className="font-sans text-[10px] font-semibold uppercase tracking-wider text-[#b8b6b1]">
          Wager Market
        </span>
        <Stat value={fmtPls(wager.totalVolume)} label="Vol" zero={oeVolZero} />
        <Stat value={fmtCount(wager.openWagerCount)} label="Open" zero={oeOpenZero} />
        <Stat value={fmtCount(wagerCompleted)} label="Done" zero={oeDoneZero} />
      </div>
    </div>
  )
}