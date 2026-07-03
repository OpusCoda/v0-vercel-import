import { useEffect, useState } from 'react'
import { useAccount, useReadContract, useReadContracts } from 'wagmi'
import { STAKING_CONTRACT, STAKING_ABI, SMAUG_TOKEN, ERC20_ABI, formatSmaugBalance } from '@/lib/staking'

export function useStakingData() {
  const { address } = useAccount()
  const [totalStaked, setTotalStaked] = useState<string>('0')
  const [totalStakedRaw, setTotalStakedRaw] = useState<bigint>(0n)
  const [totalWeightedStakeRaw, setTotalWeightedStakeRaw] = useState<bigint>(0n)
  const [contractSmaugBalance, setContractSmaugBalance] = useState<bigint>(0n)
  const [totalStakers, setTotalStakers] = useState<number>(0)
  const [balance, setBalance] = useState<string>('0')
  const [minStakeAmount, setMinStakeAmount] = useState<string>('0')
  const [userStakeIds, setUserStakeIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const { data: contractSmaugBalanceData } = useReadContract({
    address: SMAUG_TOKEN as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [STAKING_CONTRACT as `0x${string}`],
    query: { refetchInterval: 30000 },
  })

  const { data: totalStakedData } = useReadContract({
    address: STAKING_CONTRACT as `0x${string}`,
    abi: STAKING_ABI,
    functionName: 'totalStaked',
    query: { refetchInterval: 30000 },
  })

  const { data: totalWeightedStakeData } = useReadContract({
    address: STAKING_CONTRACT as `0x${string}`,
    abi: STAKING_ABI,
    functionName: 'totalWeightedStake',
    query: { refetchInterval: 30000 },
  })

  const { data: totalStakersData } = useReadContract({
    address: STAKING_CONTRACT as `0x${string}`,
    abi: STAKING_ABI,
    functionName: 'totalStakers',
    query: { refetchInterval: 30000 },
  })

  const { data: minStakeData } = useReadContract({
    address: STAKING_CONTRACT as `0x${string}`,
    abi: STAKING_ABI,
    functionName: 'minStakeAmount',
  })

  const { data: balanceData } = useReadContract({
    address: SMAUG_TOKEN as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 30000 },
  })

  const { data: stakeIdsData } = useReadContracts({
    contracts: address ? Array.from({ length: 20 }, (_, i) => ({
      address: STAKING_CONTRACT as `0x${string}`,
      abi: STAKING_ABI,
      functionName: 'userStakeIds' as const,
      args: [address, BigInt(i)] as const,
    })) : [],
    query: { enabled: !!address },
  })

  useEffect(() => {
    if (totalStakedData !== undefined) {
      const staked = typeof totalStakedData === 'bigint' ? totalStakedData : BigInt(totalStakedData)
      setTotalStaked(formatSmaugBalance(staked))
      setTotalStakedRaw(staked)
    }
    if (totalWeightedStakeData !== undefined) {
      const weighted = typeof totalWeightedStakeData === 'bigint' ? totalWeightedStakeData : BigInt(totalWeightedStakeData)
      setTotalWeightedStakeRaw(weighted)
    }
    if (contractSmaugBalanceData !== undefined) {
      const bal = typeof contractSmaugBalanceData === 'bigint' ? contractSmaugBalanceData : BigInt(contractSmaugBalanceData)
      setContractSmaugBalance(bal)
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
    if (stakeIdsData) {
      const ids = stakeIdsData
        .filter(result => result.status === 'success' && result.result !== undefined)
        .map(result => (result.result as bigint).toString())
      setUserStakeIds(ids)
    }
    setIsLoading(false)
  }, [totalStakedData, totalWeightedStakeData, contractSmaugBalanceData, totalStakersData, balanceData, minStakeData, stakeIdsData])

  return {
    totalStaked,
    totalStakedRaw,
    totalWeightedStakeRaw,
    contractSmaugBalance,
    totalStakers,
    balance,
    minStakeAmount,
    userStakeIds,
    isLoading,
  }
}