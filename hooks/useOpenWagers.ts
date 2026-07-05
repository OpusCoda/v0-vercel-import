import { useEffect, useState } from 'react'
import { useReadContract, useReadContracts } from 'wagmi'
import { WAGER_MARKET_ADDRESS, WAGER_MARKET_ABI } from '@/lib/wager-market'

export interface WagerDetails {
  id: bigint
  creator: string
  wagerType: number
  amount: bigint
  odds: bigint
  expiresAt: bigint
  status: number
  winner: string
  createdAt: bigint
  resolvedAt: bigint
}

export function useOpenWagers() {
  const [wagerIds, setWagerIds] = useState<bigint[]>([])
  const [wagers, setWagers] = useState<WagerDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch open wager IDs
  const { data: openWagerIdsData, isLoading: idsLoading } = useReadContract({
    address: WAGER_MARKET_ADDRESS,
    abi: WAGER_MARKET_ABI,
    functionName: 'getOpenWagers',
    query: { refetchInterval: 30000 },
  })

  // Batch fetch wager details for all open wagers
  const { data: wagerDetailsData, isLoading: detailsLoading } = useReadContracts({
    contracts: wagerIds.map((wagerId) => ({
      address: WAGER_MARKET_ADDRESS,
      abi: WAGER_MARKET_ABI,
      functionName: 'getWagerDetails' as const,
      args: [wagerId] as const,
    })),
    query: { enabled: wagerIds.length > 0, refetchInterval: 30000 },
  })

  // Update wager IDs when fetched
  useEffect(() => {
    if (openWagerIdsData && Array.isArray(openWagerIdsData)) {
      setWagerIds(openWagerIdsData)
    }
  }, [openWagerIdsData])

  // Update wager details when fetched
  useEffect(() => {
    if (wagerDetailsData && wagerDetailsData.length > 0) {
      const details = wagerDetailsData
        .filter((result) => result.status === 'success' && result.result)
        .map((result) => {
          const wager = (result.result as any)?.[0]
          return {
            id: wager.id,
            creator: wager.creator,
            wagerType: wager.wagerType,
            amount: wager.amount,
            odds: wager.odds,
            expiresAt: wager.expiresAt,
            status: wager.status,
            winner: wager.winner,
            createdAt: wager.createdAt,
            resolvedAt: wager.resolvedAt,
          } as WagerDetails
        })
      setWagers(details)
    }
    setIsLoading(idsLoading || detailsLoading)
  }, [wagerDetailsData, idsLoading, detailsLoading])

  return {
    wagers,
    wagerIds,
    isLoading: isLoading || idsLoading || detailsLoading,
  }
}
