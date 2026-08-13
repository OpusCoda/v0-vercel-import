import { useEffect, useState } from 'react'
import { usePublicClient, useAccount } from 'wagmi'
import { parseAbiItem } from 'viem'
import { STAKING_CONTRACT } from '@/lib/staking'

const UNSTAKED_EVENT = parseAbiItem(
  'event Unstaked(address indexed user, uint256 indexed stakeId, uint256 principal, uint256 smaugRewards)'
)

export interface CompletedStake {
  stakeId: string
  principalReturned: bigint  // from the Unstaked event
}

// Lists a wallet's ended stakes by reading past Unstaked events.
// The stake struct itself is deleted on-chain, so only reward history
// (via rewardTotalsByStake) and the event's principal figure remain.
export function useCompletedStakes(): { completed: CompletedStake[]; loaded: boolean } {
  const client = usePublicClient()
  const { address } = useAccount()
  const [completed, setCompleted] = useState<CompletedStake[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!client || !address) return
    const publicClient = client
    let cancelled = false

    async function load() {
      try {
        const logs = await publicClient.getLogs({
          address: STAKING_CONTRACT as `0x${string}`,
          event: UNSTAKED_EVENT,
          args: { user: address },
          fromBlock: 'earliest',
          toBlock: 'latest',
        })
        const rows: CompletedStake[] = logs.map((log) => {
          const a = log.args as any
          return {
            stakeId: (a.stakeId ?? 0n).toString(),
            principalReturned: a.principal ?? 0n,
          }
        })
        if (!cancelled) { setCompleted(rows); setLoaded(true) }
      } catch (err) {
        console.error('[completed] getLogs failed:', err)
        if (!cancelled) { setCompleted([]); setLoaded(true) }
      }
    }
    load()
    return () => { cancelled = true }
  }, [client, address])

  return { completed, loaded }
}