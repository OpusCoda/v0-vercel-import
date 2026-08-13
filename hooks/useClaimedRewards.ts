import { useEffect, useState } from 'react'
import { usePublicClient } from 'wagmi'
import { parseAbiItem } from 'viem'
import { STAKING_CONTRACT } from '@/lib/staking'

const REWARD_CLAIMED_EVENT = parseAbiItem(
  'event RewardClaimed(address indexed user, uint256 indexed stakeId, uint256 plsKept, uint256 plsForfeited, uint256 smaugKept, uint256 smaugForfeited, uint256 reflectionKept, uint256 reflectionForfeited)'
)

export interface ClaimedTotals {
  plsKept: bigint
  plsForfeited: bigint
  smaugKept: bigint       // smaugKept + reflectionKept
  smaugForfeited: bigint  // smaugForfeited + reflectionForfeited
  loaded: boolean
}

const EMPTY: ClaimedTotals = {
  plsKept: 0n, plsForfeited: 0n, smaugKept: 0n, smaugForfeited: 0n, loaded: false,
}

// Sums all past RewardClaimed events for one stakeId into lifetime totals.
// The staking contract stores no cumulative-claimed value, so we derive it from logs.
export function useClaimedRewards(stakeId: string | undefined): ClaimedTotals {
  const client = usePublicClient()
  const [totals, setTotals] = useState<ClaimedTotals>(EMPTY)

  useEffect(() => {
    if (!client || stakeId === undefined) return
    const publicClient = client
    const sid = stakeId
    let cancelled = false

    async function load() {
      try {
        const logs = await publicClient.getLogs({
          address: STAKING_CONTRACT as `0x${string}`,
          event: REWARD_CLAIMED_EVENT,
          args: { stakeId: BigInt(sid) },
          fromBlock: 'earliest',
          toBlock: 'latest',
        })

        let plsKept = 0n, plsForfeited = 0n, smaugKept = 0n, smaugForfeited = 0n
        for (const log of logs) {
          const a = log.args as any
          plsKept        += a.plsKept ?? 0n
          plsForfeited   += a.plsForfeited ?? 0n
          smaugKept      += (a.smaugKept ?? 0n) + (a.reflectionKept ?? 0n)
          smaugForfeited += (a.smaugForfeited ?? 0n) + (a.reflectionForfeited ?? 0n)
        }
        if (!cancelled) setTotals({ plsKept, plsForfeited, smaugKept, smaugForfeited, loaded: true })
      } catch (err) {
        console.error('[claimed] getLogs failed:', err)
        if (!cancelled) setTotals({ ...EMPTY, loaded: true })
      }
    }
    load()
    return () => { cancelled = true }
  }, [client, stakeId])

  return totals
}