import { useMemo } from 'react'
import { useReadContract, useReadContracts } from 'wagmi'
import { WAGER_MARKET_ADDRESS, WAGER_MARKET_ABI } from '@/lib/wager-market'
import type { WagerDetails } from '@/hooks/useOpenWagers'
/**
 * Fetches ALL wagers (every status), not just open ones.
 *
 * Reads wagerCount, then batch-fetches getWagerDetails for ids 0..count-1.
 * Lets the UI show Open / Active / Resolved etc. by filtering on status.
 *
 * Status enum: 0 Created, 1 Active, 2 Voting, 3 Resolved, 4 Arbitration, 5 Cancelled, 6 Voided
 *
 * Note: this reads every wager each poll. Fine for hundreds; if the market grows
 * into the thousands, switch to a paginated/indexed source (subgraph or a
 * contract getter that returns a slice).
 */
export function useAllWagers() {
  // Total number of wagers ever created.
  const { data: countData, isLoading: countLoading } = useReadContract({
    address: WAGER_MARKET_ADDRESS,
    abi: WAGER_MARKET_ABI,
    functionName: 'totalWagerCount',
    query: { refetchInterval: 30000 },
  })
  const count = countData ? Number(countData as bigint) : 0
  const ids = useMemo(() => Array.from({ length: count }, (_, i) => BigInt(i)), [count])
  const { data: detailsData, isLoading: detailsLoading } = useReadContracts({
    contracts: ids.map((wagerId) => ({
      address: WAGER_MARKET_ADDRESS,
      abi: WAGER_MARKET_ABI,
      functionName: 'getWagerDetails' as const,
      args: [wagerId] as const,
    })),
    query: { enabled: ids.length > 0, refetchInterval: 30000 },
  })
  const wagers: WagerDetails[] = useMemo(() => {
    if (!detailsData) return []
    // getWagerDetails returns FOUR values now — the priceBet tuple is gone:
    //   [ wager(tuple), creatorRequestedVoid, challengerRequestedVoid, arbitrationStart ]
    return detailsData
      .map((result, i) => {
        if (result.status !== 'success' || !result.result) return null
        const res = result.result as any
        const w = res[0]
        if (!w) return null
        return {
          id: ids[i],
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
          winner: w.winner,
          creatorRequestedVoid: Boolean(res[1]),
          challengerRequestedVoid: Boolean(res[2]),
          arbitrationStart: (res[3] ?? 0n) as bigint,
        } as WagerDetails
      })
      .filter((x): x is WagerDetails => x !== null)
  }, [detailsData, ids])
  return {
    wagers,
    isLoading: countLoading || detailsLoading,
  }
}