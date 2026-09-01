"use client"
import { useMemo, useState } from "react"
import { formatUnits } from "viem"
import { useMyTradeHistory } from "@/hooks/useMyTradeHistory"
import { computeRealizedPnl, type MarketRealized } from "@/lib/realized-pnl"

function fmtPls(wei: bigint, dp = 0): string {
  const neg = wei < 0n
  const abs = neg ? -wei : wei
  const s = Number(formatUnits(abs, 18)).toLocaleString(undefined, { maximumFractionDigits: dp })
  return neg ? `−${s}` : s
}

// Realized P/L cell — green when up, orange when down (matches MyMarketPositions).
function RealizedPnl({ realized, cost }: { realized: bigint; cost: bigint }) {
  const n = Number(formatUnits(realized, 18))
  const pct = cost > 0n ? (n / Number(formatUnits(cost, 18))) * 100 : undefined
  const up = realized >= 0n
  return (
    <span className={up ? "text-green-400" : "text-orange-400"}>
      {up ? "+" : "−"}{fmtPls(realized < 0n ? -realized : realized)} PLS
      {pct !== undefined && <> ({up ? "+" : "−"}{Math.abs(pct).toFixed(1)}%)</>}
    </span>
  )
}

/**
 * Expandable trade-history + realized-P&L panel for the connected user.
 *
 * Lazy by design: the on-chain event scan (useMyTradeHistory) is disabled until
 * the section is expanded, so this adds ZERO load time to the page until the
 * user opens it. Once expanded it fetches once, caches for the session, and
 * shows per-market realized P&L computed with average-cost accounting.
 *
 * Drop <TradeHistory /> onto the portfolio page wherever you like.
 */
export function TradeHistory() {
  const [expanded, setExpanded] = useState(false)
  const { events, isLoading, error, refetch } = useMyTradeHistory(expanded)

  const { byMarket, totalRealized } = useMemo(
    () => computeRealizedPnl(events),
    [events]
  )

  return (
    <div className="rounded-xl border border-[#2a2a35] bg-[#101017]">
      {/* Header / toggle */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <span className="font-serif text-lg font-semibold text-[#B87333]">
          Trade history &amp; realized P/L
        </span>
        <span className="font-sans text-xs text-[#7c7a76]">
          {expanded ? "Hide ▴" : "Show ▾"}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-[#2a2a35] px-5 py-4">
          {isLoading ? (
            <p className="py-6 text-center font-sans text-sm text-[#7c7a76]">
              Reading your trade history from the chain…
            </p>
          ) : error ? (
            <div className="py-6 text-center">
              <p className="font-sans text-sm text-red-400">
                Couldn&apos;t load trade history.
              </p>
              <button
                onClick={() => refetch()}
                className="mt-2 rounded border border-[#2a2a35] px-3 py-1 font-sans text-xs text-[#b8b6b1] hover:border-[#B87333]/50"
              >
                Retry
              </button>
            </div>
          ) : byMarket.length === 0 ? (
            <p className="py-6 text-center font-sans text-sm text-[#7c7a76]">
              No trades yet — your buys and sells will show here.
            </p>
          ) : (
            <>
              {/* Grand total */}
              <div className="mb-4 flex items-baseline justify-between">
                <span className="font-sans text-[10px] uppercase tracking-wider text-[#7c7a76]">
                  Total realized P/L
                </span>
                <span className="font-serif text-xl font-bold">
                  <RealizedPnl
                    realized={totalRealized}
                    cost={byMarket.reduce((acc, m) => acc + m.totalBought, 0n)}
                  />
                </span>
              </div>

              {/* Per-market rows */}
              <div className="overflow-x-auto rounded-lg border border-[#2a2a35]">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#2a2a35] bg-[#0d0d12]">
                      <th className="px-4 py-2.5 text-left font-sans text-xs font-semibold text-[#7c7a76]">Market</th>
                      <th className="px-4 py-2.5 text-right font-sans text-xs font-semibold text-[#7c7a76]">Bought</th>
                      <th className="px-4 py-2.5 text-right font-sans text-xs font-semibold text-[#7c7a76]">Sold</th>
                      <th className="px-4 py-2.5 text-right font-sans text-xs font-semibold text-[#7c7a76]">Status</th>
                      <th className="px-4 py-2.5 text-right font-sans text-xs font-semibold text-[#7c7a76]">Realized P/L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byMarket.map((m: MarketRealized) => (
                      <tr key={m.marketId.toString()} className="border-t border-[#2a2a35] hover:bg-[#0d0d12]/50">
                        <td className="px-4 py-3 font-sans text-sm text-[#b8b6b1]">
                          Market #{m.marketId.toString()}
                        </td>
                        <td className="px-4 py-3 text-right font-sans text-sm text-[#e8e6e3]">
                          {fmtPls(m.totalBought)} PLS
                        </td>
                        <td className="px-4 py-3 text-right font-sans text-sm text-[#e8e6e3]">
                          {fmtPls(m.totalSold)} PLS
                        </td>
                        <td className="px-4 py-3 text-right font-sans text-xs">
                          {m.closed ? (
                            <span className="text-[#7c7a76]">Closed</span>
                          ) : (
                            <span className="text-[#B87333]">
                              Open · {fmtPls(m.openShares)} sh
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-sans text-sm font-semibold">
                          <RealizedPnl realized={m.realized} cost={m.totalBought - m.remainingCost} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="mt-3 font-sans text-[10px] leading-relaxed text-[#7c7a76]">
                Realized P/L uses average-cost accounting on your on-chain buys and sells.
                Open positions show their current value in the positions table above, not here.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}