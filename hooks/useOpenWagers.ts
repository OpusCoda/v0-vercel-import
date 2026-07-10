import { useEffect, useState } from 'react'
import { useReadContract, useReadContracts } from 'wagmi'
import { WAGER_MARKET_ADDRESS, WAGER_MARKET_ABI } from '@/lib/wager-market'

// Matches the deployed contract's Wager struct (+ the id, carried from getOpenWagers).
export interface WagerDetails {
  id: bigint
  wagerType: number          // 0 = Standard, 1 = Price Bet
  category: number
  creator: string
  challenger: string
  creatorStake: bigint
  challengerStake: bigint
  creatorVoteDeposit: bigint
  challengerVoteDeposit: bigint
  description: string
  eventDate: bigint
  depositDeadline: bigint     // "expires" for an open wager = acceptance deadline
  votingDeadline: bigint
  status: number              // Status enum: 0 Created,1 Active,2 Voting,3 Resolved,4 Arbitration,5 Cancelled,6 Voided
  creatorVote: string
  challengerVote: string
  // Price-bet extras (zeroed for standard wagers)
  queryId: string
  targetPrice: bigint
  creatorBetsAbove: boolean
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
      setWagerIds(openWagerIdsData as bigint[])
    }
  }, [openWagerIdsData])

  // Update wager details when fetched. getWagerDetails returns:
  //   [ wager(tuple), priceBet(tuple), creatorRequestedVoid, challengerRequestedVoid, arbitrationStart ]
  // The Wager tuple has NO id field, so pair it with wagerIds by index.
  useEffect(() => {
    if (wagerDetailsData && wagerDetailsData.length > 0) {
      const details = wagerDetailsData
        .map((result, i) => {
          if (result.status !== 'success' || !result.result) return null
          const res = result.result as any
          const w = res[0]         // Wager tuple
          const pb = res[1]        // PriceBetData tuple
          if (!w) return null
          return {
            id: wagerIds[i],
            wagerType: Number(w.wagerType),
            category: Number(w.category),
            creator: w.creator,
            challenger: w.challenger,
            creatorStake: w.creatorStake,
            challengerStake: w.challengerStake,
            creatorVoteDeposit: w.creatorVoteDeposit,
            challengerVoteDeposit: w.challengerVoteDeposit,
            description: w.description,
            eventDate: w.eventDate,
            depositDeadline: w.depositDeadline,
            votingDeadline: w.votingDeadline,
            status: Number(w.status),
            creatorVote: w.creatorVote,
            challengerVote: w.challengerVote,
            queryId: pb?.queryId ?? '0x',
            targetPrice: pb?.targetPrice ?? 0n,
            creatorBetsAbove: pb?.creatorBetsAbove ?? false,
          } as WagerDetails
        })
        .filter((x): x is WagerDetails => x !== null)
      setWagers(details)
    } else {
      setWagers([])
    }
    setIsLoading(idsLoading || detailsLoading)
  }, [wagerDetailsData, wagerIds, idsLoading, detailsLoading])

  return {
    wagers,
    wagerIds,
    isLoading: isLoading || idsLoading || detailsLoading,
  }
}