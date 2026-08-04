"use client"

import { useMemo } from "react"
import { useAccount, useReadContract, useReadContracts } from "wagmi"
import type { Address } from "viem"
import { outcomeExchangeAbi } from "@/lib/abis/outcome-exchange"

const OUTCOME_EXCHANGE_ADDRESS = '0x4B5da4B6b4607B5bA054511ef6bD83742287e18F' as Address

const PAGE_SIZE = 100n

export function useUserOutcomeWagers() {
  const { address } = useAccount()

  const contract = {
    address: OUTCOME_EXCHANGE_ADDRESS,
    abi: outcomeExchangeAbi,
  } as const

  const {
    data: wagerCount,
    isLoading: countLoading,
    error: countError,
  } = useReadContract({
    ...contract,
    functionName: "userWagerCount",
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(address && OUTCOME_EXCHANGE_ADDRESS),
    },
  })

  const {
    data: wagerIds,
    isLoading: idsLoading,
    error: idsError,
  } = useReadContract({
    ...contract,
    functionName: "getUserWagers",
    args:
      address && wagerCount !== undefined
        ? [address, 0n, wagerCount > PAGE_SIZE ? PAGE_SIZE : wagerCount]
        : undefined,
    query: {
      enabled: Boolean(address && wagerCount !== undefined),
    },
  })

  const detailCalls = useMemo(
    () =>
      (wagerIds ?? []).map((wagerId) => ({
        ...contract,
        functionName: "getWagerDetails" as const,
        args: [wagerId] as const,
      })),
    [wagerIds]
  )

  const {
    data: details,
    isLoading: detailsLoading,
    error: detailsError,
    refetch,
  } = useReadContracts({
    contracts: detailCalls,
    allowFailure: true,
    query: {
      enabled: detailCalls.length > 0,
    },
  })

  const wagers = useMemo(() => {
    if (!wagerIds || !details) return []

    return details.flatMap((result, index) => {
      if (result.status !== "success") return []
      return [
        {
          wagerId: wagerIds[index],
          details: result.result,
        },
      ]
    })
  }, [wagerIds, details])

  return {
    wagers,
    isLoading: countLoading || idsLoading || detailsLoading,
    error: countError ?? idsError ?? detailsError,
    refetch,
  }
}

export function useOutcomeAccountSummary(address?: Address) {
  return useReadContracts({
    allowFailure: true,
    contracts: address
      ? [
          {
            address: OUTCOME_EXCHANGE_ADDRESS,
            abi: outcomeExchangeAbi,
            functionName: "getReputation",
            args: [address],
          },
          {
            address: OUTCOME_EXCHANGE_ADDRESS,
            abi: outcomeExchangeAbi,
            functionName: "getReferralInfo",
            args: [address],
          },
          {
            address: OUTCOME_EXCHANGE_ADDRESS,
            abi: outcomeExchangeAbi,
            functionName: "getUserFeeInfo",
            args: [address],
          },
          {
            address: OUTCOME_EXCHANGE_ADDRESS,
            abi: outcomeExchangeAbi,
            functionName: "protocolFeeAccrued",
            args: [address],
          },
        ]
      : [],
    query: {
      enabled: Boolean(address),
    },
  })
}
