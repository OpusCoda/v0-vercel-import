"use client"
import { useEffect, useMemo } from "react"
import { formatUnits } from "viem"
import { useMyMarketPositions, type MarketPosition } from "@/hooks/useMyMarketPositions"
import { useMyTradeHistory } from "@/hooks/useMyTradeHistory"
import { useMarketClaim, type ClaimKind } from "@/hooks/useMarketClaim"
import { computeRealizedPnl } from "@/lib/realized-pnl"
function fmtPls(wei: bigint, dp = 0): string {
  return Number(formatUnits(wei, 18)).toLocaleString(undefined, { maximumFractionDigits: dp })
}
function fmtShares(wei: bigint): string {
  return Number(formatUnits(wei, 18)).toLocaleString(undefined, { maximumFractionDigits: 0 })
}
// Which claim (if any) is available on a resolved/voided/abandoned market,
// and a human label for the button.
function claimFor(p: MarketPosition): { kind: ClaimKind; label: string } | null {
  // Each claim flag is independent — the contract computes them. Don't let a
  // completed winnings claim (p.claimed) suppress a still-available residual.
  if (p.canClaimWinnings && !p.claimed) return { kind: "winnings", label: "Claim winnings" }
  if (p.canClaimVoidRefund) return { kind: "voidRefund", label: "Claim refund" }
  if (p.canClaimAbandoned) return { kind: "abandoned", label: "Claim refund" }
  if (p.canClaimResidual) return { kind: "residual", label: "Claim residual" }
  return null
}
// A single market's claim button, wired to useMarketClaim. Kept as its own
// component so each has independent tx state.
function ClaimButton({
  position,
  onClaimed,
}: {
  position: MarketPosition
  onClaimed: () => void
}) {
  const claimable = claimFor(position)
  const { claim, isPending, isConfirming, isSuccess, writeError } = useMarketClaim()
  useEffect(() => {
    if (isSuccess) onClaimed()
  }, [isSuccess, onClaimed])
  if (!claimable) return null
  let label = claimable.label
  if (isSuccess) label = "Claimed ✓"
  else if (isPending) label = "Confirm in wallet…"
  else if (isConfirming) label = "Claiming…"
  const amount = position.claimableAmount
  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={() => claim(position.marketId, claimable.kind)}
        disabled={isPending || isConfirming || isSuccess}
        className="rounded border border-[#B87333]/40 bg-[#1a1a20] px-3 py-1.5 font-sans text-xs font-semibold text-[#B87333] transition-colors hover:bg-[#B87333]/10 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {label}
        {amount > 0n && !isSuccess && (
          <span className="ml-1 text-[#b8b6b1]">({fmtPls(amount)} PLS)</span>
        )}
      </button>
      {writeError && (
        <span className="font-sans text-[10px] text-red-400">Claim failed — see wallet.</span>
      )}
    </div>
  )
}
// P/L cell — green/red with sign and %.
function Pnl({ pnl, basis }: { pnl: bigint; basis: bigint }) {
  const n = Number(formatUnits(pnl, 18))
  const pct = basis > 0n ? (n / Number(formatUnits(basis, 18))) * 100 : undefined
  const up = pnl >= 0n
  return (
    <span className={up ? "text-green-400" : "text-orange-400"}>
      {up ? "+" : "−"}{fmtPls(pnl < 0n ? -pnl : pnl)} PLS
      {pct !== undefined && <> ({up ? "+" : "−"}{Math.abs(pct).toFixed(1)}%)</>}
    </span>
  )
}
export function MyMarketPositions() {
  const { positions, isLoading, refetch } = useMyMarketPositions()
  // TEMP TEST — remove after verifying
  const hist = useMyTradeHistory(true)
  useEffect(() => {
    if (!hist.isLoading) {
      console.log("[history]", hist.events, hist.error)
      const pnl = computeRealizedPnl(hist.events)
      console.log("[realized]", pnl.byMarket, "total:", pnl.totalRealized)
    }
  }, [hist.events, hist.isLoading, hist.error])
  const { openPositions, settleable, totalValue, totalPnl, totalClaimable } = useMemo(() => {
    const open: MarketPosition[] = []
    const settle: MarketPosition[] = []
    let value = 0n
    let pnl = 0n
    let claimable = 0n
    for (const p of positions) {
      const hasClaim = claimFor(p) !== null
      const hasShares = p.sides.length > 0
      const settled = p.market.resolved || p.market.voided
      if (settled || hasClaim) {
        settle.push(p)
        claimable += p.claimableAmount
      }
      if (hasShares && !settled) {
        open.push(p)
        for (const s of p.sides) {
          value += s.currentValue
          pnl += s.unrealizedPnl
        }
      }
    }
    return {
      openPositions: open,
      settleable: settle,
      totalValue: value,
      totalPnl: pnl,
      totalClaimable: claimable,
    }
  }, [positions])
  if (isLoading) {
    return (
      <div className="py-8 text-center">
        <p className="font-sans text-sm text-[#7c7a76]">Loading your Probability Shop positions…</p>
      </div>
    )
  }
  if (positions.length === 0) {
    return (
      <div className="rounded-lg border border-[#2a2a35] bg-[#101017] p-6 text-center">
        <p className="font-sans text-sm text-[#7c7a76]">
          No Probability Shop positions yet — buy Yes or No on a market to open one.
        </p>
      </div>
    )
  }
  return (
    <div className="space-y-6">
      {/* Summary strip */}
      <div className="flex flex-wrap gap-3">
        <div className="rounded-xl border border-[#2a2a35] bg-[#101017] px-4 py-3">
          <div className="font-sans text-[10px] uppercase tracking-wider text-[#7c7a76]">Position value</div>
          <div className="font-sans text-lg font-bold text-[#e8e6e3]">{fmtPls(totalValue)} PLS</div>
        </div>
        <div className="rounded-xl border border-[#2a2a35] bg-[#101017] px-4 py-3">
          <div className="font-sans text-[10px] uppercase tracking-wider text-[#7c7a76]">Unrealized P/L</div>
          <div className="font-sans text-lg font-bold">
            <Pnl pnl={totalPnl} basis={totalValue - totalPnl} />
          </div>
        </div>
        {totalClaimable > 0n && (
          <div className="rounded-xl border border-[#B87333]/25 bg-[#B87333]/[0.05] px-4 py-3">
            <div className="font-sans text-[10px] uppercase tracking-wider text-[#B87333]">Claimable</div>
            <div className="font-sans text-lg font-bold text-[#B87333]">{fmtPls(totalClaimable)} PLS</div>
          </div>
        )}
      </div>
      {/* Open positions */}
      {openPositions.length > 0 && (
        <div>
          <h3 className="mb-3 font-serif text-lg font-semibold text-[#B87333]">Open positions</h3>
          <div className="overflow-x-auto rounded-lg border border-[#2a2a35] bg-[#101017]">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2a2a35] bg-[#0d0d12]">
                  <th className="px-4 py-3 text-left font-sans text-xs font-semibold text-[#7c7a76]">Market</th>
                  <th className="px-4 py-3 text-left font-sans text-xs font-semibold text-[#7c7a76]">Side</th>
                  <th className="px-4 py-3 text-right font-sans text-xs font-semibold text-[#7c7a76]">Shares</th>
                  <th className="px-4 py-3 text-right font-sans text-xs font-semibold text-[#7c7a76]">Value</th>
                  <th className="px-4 py-3 text-right font-sans text-xs font-semibold text-[#7c7a76]">Unrealized P/L</th>
                </tr>
              </thead>
              <tbody>
                {openPositions.flatMap((p) =>
                  p.sides.map((s) => (
                    <tr key={`${p.marketId}-${s.side}`} className="border-t border-[#2a2a35] hover:bg-[#0d0d12]/50">
                      <td className="px-4 py-3 text-sm text-[#b8b6b1] max-w-xs">{p.market.question}</td>
                      <td className="px-4 py-3 text-sm font-semibold">
                        <span className={s.side === "YES" ? "text-green-400" : "text-red-400"}>{s.side}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-[#e8e6e3]">{fmtShares(s.shares)}</td>
                      <td className="px-4 py-3 text-right text-sm text-[#e8e6e3]">{fmtPls(s.currentValue)} PLS</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold">
                        <Pnl pnl={s.unrealizedPnl} basis={s.costBasis} />
                      </td>
                    </tr>
              ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* Settleable — resolved / voided, with claim buttons */}
      {settleable.length > 0 && (
        <div>
          <h3 className="mb-3 font-serif text-lg font-semibold text-[#B87333]">Ready to claim</h3>
          <div className="space-y-2 rounded-lg border border-[#2a2a35] bg-[#101017] p-4">
            {settleable.map((p) => {
              const claimable = claimFor(p)
              const statusLabel = p.market.voided ? "Voided" : p.market.resolved ? "Resolved" : "—"
              const claimTypeLabel = claimable
                ? claimable.kind === "winnings"
                  ? "Winnings available"
                  : claimable.kind === "residual"
                    ? "Seed liquidity to reclaim"
                    : claimable.kind === "voidRefund"
                      ? "Refund available"
                      : "Refund available"
                : null
              return (
                <div
                  key={`settle-${p.marketId}`}
                  className="flex items-center justify-between gap-3 rounded border border-[#2a2a35] bg-[#0d0d12] p-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-sans text-sm font-semibold text-[#e8e6e3]">
                      {p.market.question}
                    </div>
                    <div className="mt-0.5 font-sans text-[10px] text-[#7c7a76]">
                      {statusLabel}
                      {claimTypeLabel && <span className="text-[#B87333]"> · {claimTypeLabel}</span>}
                      </div>
                    </div>
                  {claimable ? (
                    <ClaimButton position={p} onClaimed={refetch} />
                  ) : (
                    <span className="shrink-0 font-sans text-xs text-[#7c7a76]">
                      {p.claimed ? "Claimed" : "Nothing to claim"}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}