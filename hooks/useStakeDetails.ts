import { useReadContract } from 'wagmi'
import { STAKING_CONTRACT, STAKING_ABI, SMAUG_TOKEN } from '@/lib/staking'

export interface StakeDetail {
  stakeId: string
  owner: string
  amount: bigint
  startTime: number
  duration: number
  endTime: number
  tierIndex: number
  multiplier: bigint
}

export function useStakeDetails(stakeId: string | undefined) {
  const { data: stakeData } = useReadContract({
    address: STAKING_CONTRACT as `0x${string}`,
    abi: STAKING_ABI,
    functionName: 'stakes',
    args: stakeId ? [BigInt(stakeId)] : undefined,
    query: { enabled: !!stakeId, refetchInterval: 30000 },
  })

  return stakeData as any
}

export function usePendingReward(stakeId: string | undefined, tokenAddress: string = '0x0000000000000000000000000000000000000000') {
  const { data: rewardData } = useReadContract({
    address: STAKING_CONTRACT as `0x${string}`,
    abi: STAKING_ABI,
    functionName: 'pendingReward',
    args: stakeId && tokenAddress ? [BigInt(stakeId), tokenAddress as `0x${string}`] : undefined,
    query: { enabled: !!stakeId, refetchInterval: 30000 },
  })

  return rewardData ? BigInt(rewardData) : BigInt(0)
}

export function getMaturityInfo(startTime: number, duration: number): string {
  const now = Math.floor(Date.now() / 1000)
  const daysElapsed = Math.floor((now - startTime) / 86400)
  const totalDays = Math.floor(duration / 86400)
  const daysRemaining = Math.max(0, totalDays - daysElapsed)
  
  return `Day ${daysElapsed}/${totalDays} (${daysRemaining} days left)`
}
