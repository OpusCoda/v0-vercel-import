"use client"

import { useMemo } from "react"
import { useReadContract, useReadContracts } from "wagmi"
import type { Address } from "viem"
import { predictionMarketAbi } from "@/lib/abis/prediction-market"

const PREDICTION_MARKET_ADDRESS =
  (process.env.NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS as Address) ||
  ("0x77b004A0029d725e353E5EE0D80102516A4e52a8" as Address)

// The Market struct as returned by getMarket (32 fields). Only the fields the
// UI needs are typed here; the rest come back but we ignore them.
export interface RawMarket {
  question: string
  resolutionCriteria: string
  source: string
  category: number
  creator: Address
  bettingDeadline: bigint
  resolutionDeadline: bigint
  resolved: boolean
  outcome: boolean
  voided: boolean
  resolvedAt: bigint
  yesPool: bigint
  noPool: bigint
  seedLiquidity: bigint
  totalYesShares: bigint
  totalNoShares: bigint
  totalVolume: bigint
  uniqueTraders: bigint
  proposer: Address
  proposedOutcome: boolean
  proposalTime: bigint
  proposalBond: bigint
  proposalActive: boolean
  disputed: boolean
  proposalId: bigint
  seedRecouped: boolean
  totalNetCollateral: bigint
  settlementPool: bigint
  remainingSettlementPool: bigint
  remainingMarketBalance: bigint
  claimedWinningShares: bigint
  residualClaimed: boolean
}

export interface MarketWithId {
  marketId: bigint
  market: RawMarket
}

export function useAllMarkets() {
  const contract = {
    address: PREDICTION_MARKET_ADDRESS,
    abi: predictionMarketAbi,
  } as const

  const {
    data: countData,
    isLoading: countLoading,
    error: countError,
  } = useReadContract({
    ...contract,
    functionName: "marketCount",
  })

  const count = countData !== undefined ? Number(countData as bigint) : 0

  const marketCalls = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        ...contract,
        functionName: "getMarket" as const,
        args: [BigInt(i)] as const,
      })),
    [count]
  )

  const {
    data: marketReads,
    isLoading: marketsLoading,
    error: marketsError,
    refetch,
  } = useReadContracts({
    contracts: marketCalls,
    allowFailure: true,
    query: { enabled: count > 0, refetchInterval: 5000 },
  })

  const markets = useMemo<MarketWithId[]>(() => {
    if (!marketReads) return []
    return marketReads.flatMap((result, index) => {
      if (result.status !== "success" || !result.result) return []
      return [
        {
          marketId: BigInt(index),
          market: result.result as unknown as RawMarket,
        },
      ]
    })
  }, [marketReads])

  return {
    markets,
    isLoading: countLoading || marketsLoading,
    error: countError ?? marketsError,
    refetch,
  }
}