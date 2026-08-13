"use client"
import { useEffect, useState } from "react"
import { useAccount, useReadContract } from "wagmi"
import { formatUnits, parseUnits } from "viem"
import { predictionMarketAbi } from "@/lib/abis/prediction-market"
import { useSellShares } from "@/hooks/useSellShares"
const PREDICTION_MARKET_ADDRESS = "0xBeE9e50cF2b522D225b2B2115C0c0F2ce2aFE392"
function fmt(v: number, dp = 0) {
  return v.toLocaleString(undefined, { maximumFractionDigits: dp })
}
// getUserPosition tuple order (cost-basis contract):
// yesShares, noShares, netCollateral, yesCostBasis, noCostBasis, hasTraded, ...
interface RawPos {
  yesShares: bigint
  noShares: bigint
  netCollateral: bigint
  yesCostBasis: bigint
  noCostBasis: bigint
}
const EXIT_PERCENTS = [25, 50, 75, 100] as const
/**
 * Inline sell / close-position panel for one side of a binary market.
 * Reads the user's held shares for this market+side, lets them exit
 * 25/50/75/100% of the position, previews the PLS out + cost-basis P/L,
 * and submits sellShares with a slippage guard.
 *
 * Renders nothing if the user holds no shares on this side.
 */
export function SellSection({
  marketId,
  side,
  onClose,
}: {
  marketId: bigint
  side: boolean // true = YES, false = NO
  onClose: () => void
}) {
  const { address, isConnected } = useAccount()
  const [txKey, setTxKey] = useState(0)
  const [pct, setPct] = useState<number>(100)
  const [slippageBps, setSlippageBps] = useState(100)
  // Read the user's position for this market. Polls so the held-shares figure
  // self-corrects after a sell (or a buy elsewhere) without a manual refresh.
  const { data: posRaw, refetch: refetchPos } = useReadContract({
    address: PREDICTION_MARKET_ADDRESS,
    abi: predictionMarketAbi,
    functionName: "getUserPosition",
    args: address ? [marketId, address] : undefined,
    query: { enabled: !!address, refetchInterval: 8000 },
  })
  const pos = posRaw as unknown as RawPos | undefined
  const heldShares = pos ? (side ? pos.yesShares : pos.noShares) : 0n
  const costBasis = pos ? (side ? pos.yesCostBasis : pos.noCostBasis) : 0n
  // Nothing to sell on this side → render nothing.
  if (!pos || heldShares === 0n) return null
  return (
    <SellPanel
      key={txKey}
      marketId={marketId}
      side={side}
      onClose={onClose}
      isConnected={isConnected}
      heldShares={heldShares}
      costBasis={costBasis}
      pct={pct}
      setPct={(p) => {
        setPct(p)
        setTxKey((k) => k + 1)
      }}
      slippageBps={slippageBps}
      setSlippageBps={(b) => {
        setSlippageBps(b)
        setTxKey((k) => k + 1)
      }}
      onSold={() => {
        // Refresh held shares immediately when a sell confirms.
        refetchPos()
      }}
    />
  )
}
function SellPanel({
  marketId,
  side,
  onClose,
  isConnected,
  heldShares,
  costBasis,
  pct,
  setPct,
  slippageBps,
  setSlippageBps,
  onSold,
}: {
  marketId: bigint
  side: boolean
  onClose: () => void
  isConnected: boolean
  heldShares: bigint
  costBasis: bigint
  pct: number
  setPct: (p: number) => void
  slippageBps: number
  setSlippageBps: (b: number) => void
  onSold: () => void
}) {
  // Shares to sell = held * pct / 100. Full exit (100%) sells the exact held
  // amount to avoid any rounding dust left behind.
  // A typed amount (whole shares) overrides the percentage picker, capped at held.
  const [manualShares, setManualShares] = useState<string>("")
  const manualSharesWei = (() => {
    if (manualShares.trim() === "") return null
    const n = Number(manualShares.replace(/,/g, ""))
    if (!Number.isFinite(n) || n <= 0) return null
    try {
      const wei = parseUnits(manualShares.replace(/,/g, ""), 18)
      return wei > heldShares ? heldShares : wei
    } catch {
      return null
    }
  })()
  const sharesIn = manualSharesWei !== null ? manualSharesWei : 0n
  const {
    quote,
    quoteLoading,
    quoteError,
    sell,
    isPending,
    isConfirming,
    isSuccess,
    writeError,
  } = useSellShares(marketId, side, sharesIn, slippageBps)
  // On a confirmed sell, tell the parent to refetch the position read so the
  // held-shares figure updates without a page refresh.
  useEffect(() => {
    if (isSuccess) onSold()
  }, [isSuccess, onSold])
  const sideLabel = side ? "Yes" : "No"
  const sideColor = side ? "text-green-400" : "text-red-400"
  const sideBorder = side ? "border-green-400/30" : "border-red-400/30"
  const heldNum = Number(formatUnits(heldShares, 18))
  const sellingNum = Number(formatUnits(sharesIn, 18))
  // PLS out (from quote) and the portion of cost basis being exited.
  const plsOut = quote ? Number(formatUnits(quote.plsOut, 18)) : undefined
  const impactPct = quote ? Number(quote.priceImpactBps) / 100 : undefined
  const exitCostBasisWei =
    heldShares > 0n ? (costBasis * sharesIn) / heldShares : 0n
  const exitCostBasis = Number(formatUnits(exitCostBasisWei, 18))
  // Realized P/L on this exit = plsOut - cost basis of sold shares.
  const pnl =
    plsOut !== undefined ? plsOut - exitCostBasis : undefined
  const pnlPct =
    pnl !== undefined && exitCostBasis > 0 ? (pnl / exitCostBasis) * 100 : undefined
  let btnLabel: string
  if (!isConnected) btnLabel = "Connect wallet"
  else if (isSuccess) btnLabel = "Sold ✓"
  else if (isPending) btnLabel = "Confirm in wallet…"
  else if (isConfirming) btnLabel = "Selling…"
  else btnLabel = sharesIn >= heldShares && sharesIn > 0n
    ? `Close ${sideLabel} position`
    : `Sell ${sideLabel} shares`
  const disabled =
    !isConnected || !quote || isPending || isConfirming || isSuccess || sharesIn === 0n
  return (
    <div className={`mt-3 rounded-lg border ${sideBorder} bg-[#0d0d12] p-3`}>
      <div className="mb-2 flex items-center justify-between">
        <span className={`font-sans text-xs font-semibold ${sideColor}`}>
          Sell {sideLabel} shares
        </span>
        <button
          onClick={onClose}
          className="font-sans text-[10px] text-[#7c7a76] hover:text-[#b8b6b1]"
        >
          Close
        </button>
      </div>
      {/* Held */}
      <div className="flex items-center justify-between font-sans text-[10px] text-[#b8b6b1]">
        <span className="text-[#7c7a76]">You hold</span>
        <span className="text-[#e8e6e3]">{fmt(heldNum)} {sideLabel} shares</span>
      </div>
      {/* Exit percentage picker */}
      <div className="mt-2 flex items-center gap-1">
        {EXIT_PERCENTS.map((p) => (
          <button
            key={p}
            onClick={() => {
              // Populate the field with the share amount for this percentage.
              // 100% uses the exact held balance to avoid rounding dust.
              const wei = p >= 100 ? heldShares : (heldShares * BigInt(p)) / 100n
              setManualShares(formatUnits(wei, 18))
            }}
            className="flex-1 rounded border border-[#2a2a35] px-1.5 py-1 font-sans text-[10px] font-semibold text-[#b8b6b1] transition-colors hover:border-[#B87333]/50"
          >
            {p === 100 ? "Max" : `${p}%`}
          </button>
        ))}
      </div>
      {/* Manual amount — overrides the percentage picker when filled */}
      <div className="mt-2">
        <input
          type="text"
          inputMode="decimal"
          value={manualShares}
          onChange={(e) => {
            const raw = e.target.value.replace(/,/g, "")
            if (raw === "" || /^\d*\.?\d*$/.test(raw)) setManualShares(raw)
          }}
          placeholder={`Or enter ${sideLabel} shares to sell`}
          className="w-full rounded border border-[#2a2a35] bg-[#0a0a0c] px-3 py-1.5 font-sans text-xs text-[#e8e6e3] placeholder-[#57565a] focus:border-[#B87333] focus:outline-none"
        />
        {manualSharesWei !== null && (
          <button
            onClick={() => setManualShares("")}
            className="mt-1 font-sans text-[10px] text-[#7c7a76] hover:text-[#b8b6b1]"
          >
            Clear — use % buttons
          </button>
        )}
      </div>
      {/* Slippage tolerance */}
      <div className="mt-2 flex items-center gap-2">
        <span className="font-sans text-[10px] text-[#7c7a76]">Max slippage</span>
        {[100, 300, 500].map((bps) => (
          <button
            key={bps}
            onClick={() => setSlippageBps(bps)}
            className={`rounded px-1.5 py-0.5 font-sans text-[10px] font-semibold transition-colors ${slippageBps === bps
              ? "bg-[#B87333] text-[#0a0a0c]"
              : "border border-[#2a2a35] text-[#b8b6b1] hover:border-[#B87333]/50"
              }`}
          >
            {bps / 100}%
          </button>
        ))}
      </div>
      {/* Preview */}
      <div className="mt-3 space-y-1 border-t border-[#2a2a35] pt-2 font-sans text-[10px] text-[#b8b6b1]">
        {quoteLoading ? (
          <p className="text-[#7c7a76]">Calculating…</p>
        ) : quoteError ? (
          <p className="text-red-400">Can’t quote this exit (check market state).</p>
        ) : quote ? (
          <>
            <div className="flex justify-between">
              <span className="text-[#7c7a76]">Selling</span>
              <span className="text-[#e8e6e3]">{fmt(sellingNum)} shares</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#7c7a76]">You receive</span>
              <span className="text-[#e8e6e3]">{plsOut !== undefined ? fmt(plsOut) : "—"} PLS</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#7c7a76]">Price impact</span>
              <span className={impactPct !== undefined && impactPct >= 5 ? "text-orange-400" : ""}>
                {impactPct !== undefined ? impactPct.toFixed(2) : "—"}%
              </span>
            </div>
            {pnl !== undefined && (
              <div className="flex justify-between">
                <span className="text-[#7c7a76]">Realized P/L</span>
                <span className={pnl >= 0 ? "text-green-400" : "text-red-400"}>
                  {pnl >= 0 ? "+" : "−"}{fmt(Math.abs(pnl))} PLS
                  {pnlPct !== undefined && (
                    <> ({pnl >= 0 ? "+" : "−"}{Math.abs(pnlPct).toFixed(1)}%)</>
                  )}
                </span>
              </div>
            )}
          </>
        ) : null}
      </div>
      {impactPct !== undefined && impactPct >= 10 && (
        <p className="mt-2 font-sans text-[10px] text-orange-400">
          High price impact ({impactPct.toFixed(1)}%) — exiting this much moves the price a lot.
        </p>
      )}
      <button
        onClick={() => sell()}
        disabled={disabled}
        className={`mt-3 w-full rounded border ${sideBorder} bg-[#1a1a20] py-1.5 font-sans text-xs font-semibold ${sideColor} transition-colors hover:bg-[#2a2a35] disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {btnLabel}
      </button>
      {writeError && (
        <p className="mt-1 font-sans text-[10px] text-red-400">
          {(() => {
            const msg = writeError.message
            if (msg.includes("SlippageTooHigh"))
              return "Price moved past your slippage tolerance — try again or raise tolerance."
            if (msg.includes("InsufficientShares"))
              return "You don't hold enough shares for this sell."
            if (
              msg.includes("BettingClosed") ||
              msg.includes("WindowClosed") ||
              msg.includes("DeadlinePassed")
            )
              return "Betting has closed — you can no longer sell into this market."
            if (msg.includes("BadInput"))
              return "Invalid sell input — check the amount."
            if (msg.includes("User rejected") || msg.includes("User denied"))
              return "You rejected the transaction in your wallet."
            return "Transaction failed — see wallet for details."
          })()}
        </p>
      )}
    </div>
  )
}