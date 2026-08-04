"use client"
import { useMemo, useState } from "react"
import {
  useReadContract,
  useSimulateContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi"
import type { Address } from "viem"
import { predictionMarketAbi } from "@/lib/abis/prediction-market"
const PREDICTION_MARKET_ADDRESS = "0x1e6b4f6426CBFF980F70B6eF79FBaa8507f6e90A" as Address
export interface SellQuote {
  plsOut: bigint
  pricePerShare: bigint
  priceImpactBps: bigint
}
/**
 * Quote + execute a sellShares trade with an exact, contract-computed slippage
 * guard. `sharesIn` is the raw 1e18-scaled share amount to sell (bigint, from
 * the user's held position); `side` is true=YES. `slippageBps` sets
 * minPlsOut = quotedPlsOut * (1 - slippageBps/10000).
 *
 * Mirrors useBuyShares, but the direction is reversed: shares go IN, PLS comes
 * OUT, so the slippage floor protects the PLS received (minPlsOut) rather than
 * shares received.
 */
export function useSellShares(
  marketId: bigint | undefined,
  side: boolean,
  sharesIn: bigint | undefined,
  slippageBps: number = 100 // 1% default tolerance
) {
  const [submitted, setSubmitted] = useState(false)
  const contract = {
    address: PREDICTION_MARKET_ADDRESS,
    abi: predictionMarketAbi,
  } as const
  const validShares = sharesIn !== undefined && sharesIn > 0n
  // Live quote from the contract for selling this exact share amount.
  const {
    data: quoteRaw,
    error: quoteError,
    isLoading: quoteLoading,
  } = useReadContract({
    ...contract,
    functionName: "quoteSell",
    args:
      marketId !== undefined && validShares
        ? [marketId, side, sharesIn!]
        : undefined,
    query: { enabled: marketId !== undefined && validShares },
  })
  // quoteSell returns (plsOut, pricePerShare, priceImpactBps).
  const quote = useMemo<SellQuote | undefined>(() => {
    if (!quoteRaw) return undefined
    const [plsOut, pricePerShare, priceImpactBps] =
      quoteRaw as readonly [bigint, bigint, bigint]
    return { plsOut, pricePerShare, priceImpactBps }
  }, [quoteRaw])
  // Slippage guard: minPlsOut = plsOut * (10000 - slippageBps) / 10000.
  const minPlsOut = useMemo(() => {
    if (!quote) return undefined
    return (quote.plsOut * BigInt(10000 - slippageBps)) / 10000n
  }, [quote, slippageBps])
  const canSubmit =
    marketId !== undefined &&
    validShares &&
    minPlsOut !== undefined &&
    minPlsOut > 0n
  // sellShares(marketId, side, sharesIn, minPlsOut) — no msg.value (shares in, PLS out).
  const { data: simulation, error: simulateError } = useSimulateContract({
    ...contract,
    functionName: "sellShares",
    args:
      canSubmit && minPlsOut !== undefined
        ? [marketId!, side, sharesIn!, minPlsOut]
        : undefined,
    query: { enabled: canSubmit },
  })
  const {
    data: hash,
    writeContract,
    isPending,
    error: writeError,
  } = useWriteContract()
  const {
    isLoading: isConfirming,
    isSuccess,
    error: receiptError,
  } = useWaitForTransactionReceipt({ hash })
  function sell() {
    if (!simulation?.request) return
    setSubmitted(true)
    writeContract(simulation.request)
  }
  return {
    quote,
    quoteLoading,
    quoteError,
    minPlsOut,
    sell,
    isPending,
    isConfirming,
    isSuccess,
    submitted,
    writeError: writeError ?? simulateError ?? receiptError,
  }
}