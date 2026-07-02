import { useEffect, useState } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import { STAKING_CONTRACT, STAKING_ABI, SMAUG_TOKEN, ERC20_ABI, formatSmaugBalance } from '@/lib/staking'

export function useStakingData() {
  const { address } = useAccount()
  const [totalStaked, setTotalStaked] = useState<string>('0')
  const [totalStakers, setTotalStakers] = useState<number>(0)
  const [balance, setBalance] = useState<string>('0')
  const [isLoading, setIsLoading] = useState(true)

  // Fetch totalStaked
  const { data: totalStakedData } = useReadContract({
    address: STAKING_CONTRACT as `0x${string}`,
    abi: STAKING_ABI,
    functionName: 'totalStaked',
  })

  // Fetch totalStakers
  const { data: totalStakersData } = useReadContract({
    address: STAKING_CONTRACT as `0x${string}`,
    abi: STAKING_ABI,
    functionName: 'totalStakers',
  })

  // Fetch user's SMAUG balance
  const { data: balanceData } = useReadContract({
    address: SMAUG_TOKEN as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  useEffect(() => {
    console.log('[v0] useStakingData - address:', address)
    console.log('[v0] useStakingData - totalStakedData:', totalStakedData)
    console.log('[v0] useStakingData - totalStakersData:', totalStakersData)
    console.log('[v0] useStakingData - balanceData:', balanceData)
    
    if (totalStakedData !== undefined) {
      const staked = typeof totalStakedData === 'bigint' ? totalStakedData : BigInt(totalStakedData)
      setTotalStaked(formatSmaugBalance(staked))
    }
    if (totalStakersData !== undefined) {
      setTotalStakers(Number(totalStakersData))
    }
    if (balanceData !== undefined) {
      const bal = typeof balanceData === 'bigint' ? balanceData : BigInt(balanceData)
      const formatted = formatSmaugBalance(bal)
      console.log('[v0] Balance formatted:', formatted)
      setBalance(formatted)
    } else {
      console.log('[v0] balanceData is still undefined, address:', address)
    }
    setIsLoading(false)
  }, [totalStakedData, totalStakersData, balanceData, address])

  return {
    totalStaked,
    totalStakers,
    balance,
    isLoading,
  }
}
