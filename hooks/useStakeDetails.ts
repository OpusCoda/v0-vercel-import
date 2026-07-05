import { useReadContract } from 'wagmi'
import { STAKING_CONTRACT, STAKING_ABI } from '@/lib/staking'

export interface StakeDetail {
  owner: `0x${string}`
  amount: bigint
  startTime: number
  endTime: number
  tierIndex: number
  weightedAmount: bigint
}

export function useStakeDetails(stakeId: string | undefined) {
  const enabled = stakeId !== undefined && stakeId !== null
  const { data: stakeData, isLoading } = useReadContract({
    address: STAKING_CONTRACT as `0x${string}`,
    abi: STAKING_ABI,
    functionName: 'stakes',
    args: enabled ? [BigInt(stakeId)] : undefined,
    query: { enabled, refetchInterval: 30000 },
  })

  if (!stakeData || isLoading) return null

  try {
    const [owner, amount, startTime, endTime, tierIndex, weightedAmount] = stakeData as unknown as any[]
    return {
      owner: owner as `0x${string}`,
      amount: BigInt(amount),
      startTime: Number(startTime),
      endTime: Number(endTime),
      tierIndex: Number(tierIndex),
      weightedAmount: BigInt(weightedAmount),
    } as StakeDetail
  } catch (err) {
    console.error('[v0] Failed to parse stake data:', err)
    return null
  }
}

export function usePendingPLS(stakeId: string | undefined) {
  const enabled = stakeId !== undefined && stakeId !== null
  const { data } = useReadContract({
    address: STAKING_CONTRACT as `0x${string}`,
    abi: STAKING_ABI,
    functionName: 'pendingPLS',
    args: enabled ? [BigInt(stakeId)] : undefined,
    query: { enabled, refetchInterval: 30000 },
  })
  return data ? BigInt(data) : 0n
}

export function usePendingSmaugReward(stakeId: string | undefined) {
  const enabled = stakeId !== undefined && stakeId !== null
  const { data } = useReadContract({
    address: STAKING_CONTRACT as `0x${string}`,
    abi: STAKING_ABI,
    functionName: 'pendingSmaugReward',
    args: enabled ? [BigInt(stakeId)] : undefined,
    query: { enabled, refetchInterval: 30000 },
  })
  return data ? BigInt(data) : 0n
}

export function usePendingSmaugReflection(stakeId: string | undefined) {
  const enabled = stakeId !== undefined && stakeId !== null
  const { data } = useReadContract({
    address: STAKING_CONTRACT as `0x${string}`,
    abi: STAKING_ABI,
    functionName: 'pendingSmaugReflection',
    args: enabled ? [BigInt(stakeId)] : undefined,
    query: { enabled, refetchInterval: 30000 },
  })
  return data ? BigInt(data) : 0n
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