import { useReadContract } from 'wagmi'
import { STAKING_CONTRACT, STAKING_ABI } from '@/lib/staking'

export interface StakeDetail {
  owner: `0x${string}`
  amount: bigint
  startTime: number
  duration: number
  endTime: number
  tierIndex: number
  multiplier: bigint
  weightedAmount: bigint
}

export function useStakeDetails(stakeId: string | undefined) {
  const { data: stakeData, isLoading, error } = useReadContract({
    address: STAKING_CONTRACT as `0x${string}`,
    abi: STAKING_ABI,
    functionName: 'stakes',
    args: stakeId !== undefined && stakeId !== null ? [BigInt(stakeId)] : undefined,
    query: { enabled: stakeId !== undefined && stakeId !== null, refetchInterval: 30000 },
  })

  if (!stakeData || isLoading) return null

  try {
    // Parse the returned tuple into our interface
    const [owner, amount, startTime, duration, endTime, tierIndex, multiplier, weightedAmount] = stakeData as unknown as any[]
    
    return {
      owner: owner as `0x${string}`,
      amount: BigInt(amount),
      startTime: Number(startTime),
      duration: Number(duration),
      endTime: Number(endTime),
      tierIndex: Number(tierIndex),
      multiplier: BigInt(multiplier),
      weightedAmount: BigInt(weightedAmount),
    } as StakeDetail
  } catch (err) {
    console.error('[v0] Failed to parse stake data:', err)
    return null
  }
}

export function usePendingReward(stakeId: string | undefined, tokenAddress: string = '0x0000000000000000000000000000000000000000') {
  const { data: rewardData } = useReadContract({
    address: STAKING_CONTRACT as `0x${string}`,
    abi: STAKING_ABI,
    functionName: 'pendingReward',
    args: stakeId !== undefined && stakeId !== null && tokenAddress ? [BigInt(stakeId), tokenAddress as `0x${string}`] : undefined,
    query: { enabled: stakeId !== undefined && stakeId !== null, refetchInterval: 30000 },
  })

    console.log('[pendingReward] stakeId:', stakeId, 'token:', tokenAddress, 'data:', rewardData?.toString())

  return rewardData ? BigInt(rewardData) : BigInt(0)
}

export function formatDate(unixTimestamp: number): string {
  return new Date(unixTimestamp * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatAddress(address: string): string {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function getDaysRemaining(endTime: number): number {
  const secondsLeft = endTime - Math.floor(Date.now() / 1000)
  return Math.max(0, Math.ceil(secondsLeft / 86400))
}

export function getMaturityInfo(startTime: number, endTime: number): string {
  const now = Math.floor(Date.now() / 1000)
  const secondsElapsed = Math.max(0, now - startTime)
  const totalSeconds = endTime - startTime
  
  const daysElapsed = Math.floor(secondsElapsed / 86400)
  const totalDays = Math.floor(totalSeconds / 86400)
  const daysRemaining = getDaysRemaining(endTime)
  
  return `Day ${daysElapsed}/${totalDays} (${daysRemaining} days left)`
}
