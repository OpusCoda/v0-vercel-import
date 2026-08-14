"use client"
import { useState, useEffect } from "react"
import { useAccount, useReadContract } from "wagmi"
import { formatUnits } from "viem"
import type { Address } from "viem"
import { predictionMarketAbi } from "@/lib/abis/prediction-market"
import { useBuyShares } from "@/hooks/useBuyShares"

const PREDICTION_MARKET_ADDRESS =
  (process.env.NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS as Address) ||
  ("0xBeE9e50cF2b522D225b2B2115C0c0F2ce2aFE392" as Address)

// Fallback until the on-chain minimumBet loads.
const FALLBACK_MINIMUM_BET_PLS = 5_000

function fmt(v: number, dp = 0) {
  return v.toLocaleString(undefined, { maximumFractionDigits: dp })
}

/**
 * Inline buy panel for one side of a binary market. Shows a live, contract-
 * quoted preview (shares out, avg price, price impact, resulting odds) and
 * submits buyShares with an exact slippage guard.
 *
 * NOTE: this is a single component (no inner panel remounted via key). The old
 * key-bump-on-input approach remounted the input every keystroke, which stole
 * focus. Instead we track the last-submitted amount and hide the stale
 * "Bought ✓" label once the user edits the amount — no remount, focus kept.
 */
export function BuySection({
  marketId,
  side,
  onClose,
}: {
  marketId: bigint
  side: boolean // true = YES, false = NO
  onClose: () => void
}) {
  const { isConnected } = useAccount()

  // Live minimum bet from the contract (owner-adjustable via setMinimumBet).
  const { data: minimumBetWei } = useReadContract({
    address: PREDICTION_MARKET_ADDRESS,
    abi: predictionMarketAbi,
    functionName: "minimumBet",
  })
  const minimumBetPls =
    minimumBetWei !== undefined
      ? Number(formatUnits(minimumBetWei as bigint, 18))
      : FALLBACK_MINIMUM_BET_PLS

  const [amount, setAmount] = useState(String(FALLBACK_MINIMUM_BET_PLS))
  const [slippageBps, setSlippageBps] = useState(100) // 1%

  const {
    quote,
    quoteLoading,
    quoteError,
    buy,
    isPending,
    isConfirming,
    isSuccess,
    writeError,
  } = useBuyShares(marketId, side, amount, slippageBps)

  // Track the amount at the moment of a successful buy. While the current
  // amount still equals that, we show "Bought ✓"; once the user edits it, we
  // treat it as a new trade and show the normal Buy label again. This replaces
  // the remount-on-keystroke hack that was stealing input focus.
  const [boughtAmount, setBoughtAmount] = useState<string | null>(null)
  useEffect(() => {
    if (isSuccess) setBoughtAmount(amount)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess])
  const showBought = isSuccess && boughtAmount === amount

  const amountNum = Number(amount || 0)
  const belowMin = amountNum > 0 && amountNum < minimumBetPls
  const sideLabel = side ? "Yes" : "No"
  const sideColor = side ? "text-green-400" : "text-red-400"
  const sideBorder = side ? "border-green-400/30" : "border-red-400/30"

  // Derived preview numbers.
  const sharesOut = quote ? Number(formatUnits(quote.sharesOut, 18)) : undefined
  const avgPrice = quote ? Number(formatUnits(quote.pricePerShare, 18)) : undefined
  const newOdds = quote ? Math.round(Number(formatUnits(quote.newSpotPrice, 18)) * 100) : undefined
  const impactPct = quote ? Number(quote.priceImpactBps) / 100 : undefined

  let btnLabel: string
  if (!isConnected) btnLabel = "Connect wallet"
  else if (showBought) btnLabel = "Bought ✓"
  else if (isPending) btnLabel = "Confirm in wallet…"
  else if (isConfirming) btnLabel = "Buying…"
  else btnLabel = `Buy ${sideLabel}`

  const disabled =
    !isConnected || belowMin || !quote || isPending || isConfirming || showBought

  return (
    <div className={`mt-3 rounded-lg border ${sideBorder} bg-[#0d0d12] p-3`}>
      <div className="mb-2 flex items-center justify-between">
        <span className={`font-sans text-xs font-semibold ${sideColor}`}>
          Buy {sideLabel} shares
        </span>
        <button
          onClick={onClose}
          className="font-sans text-[10px] text-[#7c7a76] hover:text-[#b8b6b1]"
        >
          Close
        </button>
      </div>

      {/* Amount */}
      <div className="flex items-center gap-2">
        <input
          type="number"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min={minimumBetPls}
          step="1000"
          className="flex-1 rounded border border-[#2a2a35] bg-[#0a0a0c] px-2 py-1 font-sans text-xs text-[#e8e6e3] focus:border-[#B87333] focus:outline-none"
        />
        <span className="font-sans text-xs text-[#7c7a76]">PLS</span>
      </div>

      {belowMin && (
        <p className="mt-1 font-sans text-[10px] text-orange-400">
          Minimum bet is {fmt(minimumBetPls)} PLS.
        </p>
      )}

      {/* Slippage tolerance */}
      <div className="mt-2 flex items-center gap-2">
        <span className="group relative flex items-center gap-1">
          <span className="font-sans text-[10px] text-[#7c7a76]">Max slippage</span>
          <span
            className="flex h-3 w-3 cursor-help items-center justify-center rounded-full border border-[#7c7a76] font-sans text-[8px] text-[#7c7a76]"
            aria-label="What is max slippage?"
          >
            ?
          </span>
          <span className="pointer-events-none absolute bottom-full left-0 mb-1 hidden w-56 rounded-lg border border-[#2a2a35] bg-[#1a1a20] p-2 font-sans text-[10px] leading-snug text-[#b8b6b1] group-hover:block z-10">
            In layman's terms: "Potential extra slippage (in addition to the price impact) incurred in case others enter around the same time as you." In most cases this won't be an issue, but in periods of more activity it might behoove you to set it to 3% or 5%.
          </span>
        </span>
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
      {!belowMin && amountNum > 0 && (
        <div className="mt-3 space-y-1 border-t border-[#2a2a35] pt-2 font-sans text-[10px] text-[#b8b6b1]">
          {quoteLoading ? (
            <p className="text-[#7c7a76]">Calculating…</p>
          ) : quoteError ? (
            <p className="text-red-400">Can't quote this trade (check amount / market state).</p>
          ) : quote ? (
            <>
              <div className="flex justify-between">
                <span className="text-[#7c7a76]">Shares received</span>
                <span className="text-[#e8e6e3]">{fmt(sharesOut ?? 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7c7a76]">Avg price / share</span>
                <span>{avgPrice !== undefined ? avgPrice.toFixed(4) : "—"} PLS</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7c7a76]">Price impact</span>
                <span className={impactPct !== undefined && impactPct >= 5 ? "text-orange-400" : ""}>
                  {impactPct !== undefined ? impactPct.toFixed(2) : "—"}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7c7a76]">{sideLabel} odds after buy</span>
                <span>{newOdds ?? "—"}%</span>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* High-impact warning */}
      {impactPct !== undefined && impactPct >= 10 && (
        <p className="mt-2 font-sans text-[10px] text-orange-400">
          High price impact ({impactPct.toFixed(1)}%) — this market has thin liquidity.
        </p>
      )}

      <button
        onClick={() => buy()}
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
            if (msg.includes("BelowMinBet") || msg.includes("Below minimum"))
              return `Minimum bet is ${fmt(minimumBetPls)} PLS.`
            if (
              msg.includes("BettingClosed") ||
              msg.includes("WindowClosed") ||
              msg.includes("DeadlinePassed")
            )
              return "Betting has closed for this market."
            if (msg.includes("BadInput"))
              return "Invalid trade input — check the amount."
            if (msg.includes("User rejected") || msg.includes("User denied"))
              return "You rejected the transaction in your wallet."
            if (msg.includes("insufficient funds"))
              return "Insufficient PLS balance for this trade plus gas."
            return "Transaction failed — see wallet for details."
          })()}
        </p>
      )}
    </div>
  )
}