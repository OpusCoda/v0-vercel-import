"use client"

import { useMemo } from "react"
import { useReadContracts } from "wagmi"
import type { Address } from "viem"
import { predictionMarketAbi } from "@/lib/abis/prediction-market"

const PREDICTION_MARKET_ADDRESS = process.env
  .NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS as Address

export function useProbabilityPositions(
  address: Address | undefined,
  marketIds: readonly bigint[]
) {
  const contracts = useMemo(
    () =>
      marketIds.flatMap((marketId) => [
        {
          address: PREDICTION_MARKET_ADDRESS,
          abi: predictionMarketAbi,
          functionName: "getMarket" as const,
          args: [marketId] as const,
        },
        {
          address: PREDICTION_MARKET_ADDRESS,
          abi: predictionMarketAbi,
          functionName: "getStatus" as const,
          args: [marketId] as const,
        },
        {
          address: PREDICTION_MARKET_ADDRESS,
          abi: predictionMarketAbi,
          functionName: "getUserPosition" as const,
          args: [marketId, address!] as const,
        },
      ]),
    [address, marketIds]
  )

  return useReadContracts({
    contracts,
    allowFailure: true,
    query: {
      enabled: Boolean(address && marketIds.length),
    },
  })
}

export async function fetchUserMarketIds(address: Address): Promise<bigint[]> {
  const response = await fetch(`/api/markets/user?address=${address}`)
  if (!response.ok) {
    throw new Error("Failed to fetch user market IDs")
  }
  const data = (await response.json()) as { marketIds: string[] }
  return data.marketIds.map((id) => BigInt(id))
}
