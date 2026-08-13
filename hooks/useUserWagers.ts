import { useMemo } from 'react'
import { useAccount, useReadContract, useReadContracts } from 'wagmi'
import { WAGER_MARKET_ADDRESS, WAGER_MARKET_ABI } from '@/lib/wager-market'
import type { WagerDetails } from '@/hooks/useOpenWagers'

// How many of the user's wagers to load (most recent activity fits easily).
// Bump or paginate if a single user ever exceeds this.
const PAGE = 50

/**
 * Loads the connected user's own wagers (as creator or challenger) via the
 * contract's getUserWagers index — no full-table scan.
 *
 * Groups by lifecycle:
 *   pending   — Created (0): open, awaiting a taker
 *   active    — Active (1) / Voting (2): matched, awaiting resolution
 *   completed — Resolved (3) / Cancelled (5) / Voided (6): settled
 *   (Arbitration (4) is grouped with active — still in progress)
 */
export function useUserWagers() {
  const { address } = useAccount()

  // How many wagers this user is a party to.
  const { data: countData, isLoading: countLoading } = useReadContract({
    address: WAGER_MARKET_ADDRESS,
    abi: WAGER_MARKET_ABI,
    functionName: 'userWagerCount',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 30000 },
  })

  const count = countData ? Number(countData as bigint) : 0

  // Fetch the user's wager IDs (most recent PAGE of them).
  const start = count > PAGE ? count - PAGE : 0
  const { data: idsData, isLoading: idsLoading } = useReadContract({
    address: WAGER_MARKET_ADDRESS,
    abi: WAGER_MARKET_ABI,
    functionName: 'getUserWagers',
    args: address ? [address, BigInt(start), BigInt(PAGE)] : undefined,
    query: { enabled: !!address && count > 0, refetchInterval: 30000 },
  })

  const ids = useMemo(
    () => ((idsData as bigint[] | undefined) ?? []),
    [idsData]
  )

  // Batch-fetch details for those IDs.
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
    return detailsData
      .map((result, i) => {
        if (result.status !== 'success' || !result.result) return null
        const res = result.result as any
        const w = res[0]
        const pb = res[1]
        if (!w) return null
        return {
          id: ids[i],
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
          winner: w.winner,
          queryId: pb?.queryId ?? '0x',
          targetPrice: pb?.targetPrice ?? 0n,
          creatorBetsAbove: pb?.creatorBetsAbove ?? false,
        } as WagerDetails
      })
      .filter((x): x is WagerDetails => x !== null)
      // newest first
      .reverse()
  }, [detailsData, ids])

  const grouped = useMemo(() => {
    const pending: WagerDetails[] = []
    const active: WagerDetails[] = []
    const completed: WagerDetails[] = []
    for (const w of wagers) {
      if (w.status === 0) pending.push(w)
      else if (w.status === 1 || w.status === 2 || w.status === 4) active.push(w)
      else completed.push(w) // 3 Resolved, 5 Cancelled, 6 Voided
    }
    return { pending, active, completed }
  }, [wagers])

  return {
    wagers,
    ...grouped,
    isConnected: !!address,
    isLoading: countLoading || idsLoading || detailsLoading,
  }
}