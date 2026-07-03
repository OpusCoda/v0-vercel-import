import { useEffect, useState } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import { STAKING_CONTRACT, STAKING_ABI, SMAUG_TOKEN, ERC20_ABI, formatSmaugBalance } from '@/lib/staking'

export function useStakingData() {
  const { address } = useAccount()
  console.log('[useStakingData] address:', address)
  const [totalStaked, setTotalStaked] = useState<string>('0')
  const [totalStakers, setTotalStakers] = useState<number>(0)
  const [balance, setBalance] = useState<string>('0')
  const [minStakeAmount, setMinStakeAmount] = useState<string>('0')
  const [userStakeIds, setUserStakeIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch totalStaked with 30s refetch
  const { data: totalStakedData } = useReadContract({
    address: STAKING_CONTRACT as `0x${string}`,
    abi: STAKING_ABI,
    functionName: 'totalStaked',
    query: { refetchInterval: 30000 },
  })

  // Fetch totalStakers with 30s refetch
  const { data: totalStakersData } = useReadContract({
    address: STAKING_CONTRACT as `0x${string}`,
    abi: STAKING_ABI,
    functionName: 'totalStakers',
    query: { refetchInterval: 30000 },
  })

  // Fetch minStakeAmount
  const { data: minStakeData } = useReadContract({
    address: STAKING_CONTRACT as `0x${string}`,
    abi: STAKING_ABI,
    functionName: 'minStakeAmount',
  })

  // Fetch user's SMAUG balance with 30s refetch
  const { data: balanceData } = useReadContract({
    address: SMAUG_TOKEN as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 30000 },
  })

  // Fetch user's stake IDs
  const { data: userStakeIdsData } = useReadContract({
    address: STAKING_CONTRACT as `0x${string}`,
    abi: STAKING_ABI,
    functionName: 'userStakeIds',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 30000 },
  })

  useEffect(() => {
    if (totalStakedData !== undefined) {
      const staked = typeof totalStakedData === 'bigint' ? totalStakedData : BigInt(totalStakedData)
      setTotalStaked(formatSmaugBalance(staked))
    }
    if (totalStakersData !== undefined) {
      setTotalStakers(Number(totalStakersData))
    }
    if (balanceData !== undefined) {
      const bal = typeof balanceData === 'bigint' ? balanceData : BigInt(balanceData)
      setBalance(formatSmaugBalance(bal))
    }
    if (minStakeData !== undefined) {
      const min = typeof minStakeData === 'bigint' ? minStakeData : BigInt(minStakeData)
      setMinStakeAmount(formatSmaugBalance(min))
    }
    if (userStakeIdsData && Array.isArray(userStakeIdsData)) {
      console.log('[v0] userStakeIdsData:', userStakeIdsData)
      const ids = userStakeIdsData.map((id) => {
        // Handle both bigint and string formats
        const idStr = typeof id === 'bigint' ? id.toString() : String(id)
        return idStr
      })
      console.log('[v0] Mapped userStakeIds:', ids)
      setUserStakeIds(ids)
    } else {
      console.log('[v0] userStakeIdsData is not array:', userStakeIdsData, 'Type:', typeof userStakeIdsData)
    }
    setIsLoading(false)
  }, [totalStakedData, totalStakersData, balanceData, minStakeData, userStakeIdsData])

  return {
    totalStaked,
    totalStakers,
    balance,
    minStakeAmount,
    userStakeIds,
    isLoading,
  }
}
