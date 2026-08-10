"use client"

import { useMemo, useState } from "react"
import {
  useReadContract,
  useSimulateContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi"
import { parseEther } from "viem"
import type { Address } from "viem"
import { predictionMarketAbi } from "@/lib/abis/prediction-market"

const PREDICTION_MARKET_ADDRESS =
  (process.env.NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS as Address) ||
  ("0x77b004A0029d725e353E5EE0D80102516A4e52a8" as Address)

// Zero address = no referrer.
const NO_REFERRER = "0x0000000000000000000000000000000000000000" as Address

export interface BuyQuote {
  sharesOut: bigint
  pricePerShare: bigint
  spotPrice: bigint
  newSpotPrice: bigint
  priceImpactBps: bigint
}

/**
 * Quote + execute a buyShares trade with an exact, contract-computed slippage
 * guard. `plsInput` is a whole-PLS string (e.g. "10000"); `side` is true=YES.
 * `slippageBps` sets minSharesOut = quotedShares * (1 - slippageBps/10000).
 */
export function useBuyShares(
  marketId: bigint | undefined,
  side: boolean,
  plsInput: string,
  slippageBps: number = 100 // 1% default tolerance
) {
  const [submitted, setSubmitted] = useState(false)

  const contract = {
    address: PREDICTION_MARKET_ADDRESS,
    abi: predictionMarketAbi,
  } as const

  // Parse the PLS amount to wei. Undefined if blank/invalid.
  const plsIn = useMemo(() => {
    try {
      const v = parseEther(plsInput || "0")
      return v > 0n ? v : undefined
    } catch {
      return undefined
    }
  }, [plsInput])

  // Live quote from the contract for this exact input.
  const {
    data: quoteRaw,
    error: quoteError,
    isLoading: quoteLoading,
  } = useReadContract({
    ...contract,
    functionName: "quoteBuy",
    args:
      marketId !== undefined && plsIn !== undefined
        ? [marketId, side, plsIn]
        : undefined,
    query: { enabled: marketId !== undefined && plsIn !== undefined },
  })

  const quote = useMemo<BuyQuote | undefined>(() => {
    if (!quoteRaw) return undefined
    const [sharesOut, pricePerShare, spotPrice, newSpotPrice, priceImpactBps] =
      quoteRaw as readonly [bigint, bigint, bigint, bigint, bigint]
    return { sharesOut, pricePerShare, spotPrice, newSpotPrice, priceImpactBps }
  }, [quoteRaw])

  // Slippage guard: minSharesOut = sharesOut * (10000 - slippageBps) / 10000.
  const minSharesOut = useMemo(() => {
    if (!quote) return undefined
    return (quote.sharesOut * BigInt(10000 - slippageBps)) / 10000n
  }, [quote, slippageBps])

  const canSubmit =
    marketId !== undefined &&
    plsIn !== undefined &&
    minSharesOut !== undefined &&
    minSharesOut > 0n

  const { data: simulation, error: simulateError } = useSimulateContract({
    ...contract,
    functionName: "buyShares",
    args:
      canSubmit && minSharesOut !== undefined
        ? [marketId!, side, minSharesOut, NO_REFERRER]
        : undefined,
    value: plsIn,
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

  function buy() {
    if (!simulation?.request) return
    setSubmitted(true)
    writeContract(simulation.request)
  }

  return {
    quote,
    quoteLoading,
    quoteError,
    minSharesOut,
    buy,
    isPending,
    isConfirming,
    isSuccess,
    submitted,
    writeError: writeError ?? simulateError ?? receiptError,
  }
}