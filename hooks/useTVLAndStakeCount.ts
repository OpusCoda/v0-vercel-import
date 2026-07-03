import { useEffect, useState } from 'react'
import { useReadContract } from 'wagmi'
import { STAKING_CONTRACT, STAKING_ABI, formatSmaugBalance } from '@/lib/staking'

// SMAUG price in USD (can be updated or fetched from an oracle)
// This is a placeholder - ideally should be fetched from a price oracle
const SMAUG_PRICE_USD = 0.02 // $0.02 per SMAUG

export function useTVLAndStakeCount() {
  const [tvl, setTvl] = useState<string>('—')
  const [stakeCountValue, setStakeCountValue] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch total staked
  const { data: totalStakedData } = useReadContract({
    address: STAKING_CONTRACT as `0x${string}`,
    abi: STAKING_ABI,
    functionName: 'totalStaked',
    query: { refetchInterval: 30000 },
  })

  // Fetch stake count
  const { data: stakeCountData } = useReadContract({
    address: STAKING_CONTRACT as `0x${string}`,
    abi: STAKING_ABI,
    functionName: 'stakeCount',
    query: { refetchInterval: 30000 },
  })

  useEffect(() => {
    if (totalStakedData !== undefined) {
      const staked = typeof totalStakedData === 'bigint' ? totalStakedData : BigInt(totalStakedData)
      // TVL = total staked SMAUG * SMAUG price in USD
      const stakedAmount = Number(staked) / 1e18
      const tvlUsd = stakedAmount * SMAUG_PRICE_USD
      setTvl(`$${tvlUsd.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`)
    }

    if (stakeCountData !== undefined) {
      const count = typeof stakeCountData === 'bigint' ? Number(stakeCountData) : stakeCountData
      setStakeCountValue(count)
    }

    setIsLoading(false)
  }, [totalStakedData, stakeCountData])

  return {
    tvl,
    stakeCount: stakeCountValue,
    isLoading,
  }
}
