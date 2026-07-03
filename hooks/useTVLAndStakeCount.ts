import { useEffect, useState } from 'react'
import { useReadContract } from 'wagmi'
import { STAKING_CONTRACT, STAKING_ABI, formatSmaugBalance } from '@/lib/staking'

// SMAUG token address on PulseChain
const SMAUG_ADDRESS = '0xf4754Aa585caBf38537A68660469A17E203D8632'

export function useTVLAndStakeCount() {
  const [tvl, setTvl] = useState<string>('—')
  const [stakeCountValue, setStakeCountValue] = useState<number>(0)
  const [smaugPrice, setSmaugPrice] = useState<number>(0.0002261) // Default fallback price
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

  // Fetch SMAUG price from DexScreener API
  useEffect(() => {
    const fetchSmaugPrice = async () => {
      try {
        // DexScreener API endpoint for PulseChain SMAUG pair
        const response = await fetch(
          `https://api.dexscreener.com/latest/dex/tokens/${SMAUG_ADDRESS}`
        )
        const data = await response.json()

        if (data.pairs && data.pairs.length > 0) {
          // Get the first pair (usually the most liquid one)
          const pair = data.pairs[0]
          const priceUsd = parseFloat(pair.priceUsd)
          if (priceUsd > 0) {
            setSmaugPrice(priceUsd)
            console.log('[v0] SMAUG price fetched:', priceUsd)
          }
        }
      } catch (error) {
        console.error('[v0] Failed to fetch SMAUG price:', error)
        // Keep using fallback price on error
      }
    }

    fetchSmaugPrice()
    // Refetch price every 30 seconds
    const interval = setInterval(fetchSmaugPrice, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (totalStakedData !== undefined) {
      const staked = typeof totalStakedData === 'bigint' ? totalStakedData : BigInt(totalStakedData)
      // TVL = total staked SMAUG * SMAUG price in USD
      const stakedAmount = Number(staked) / 1e18
      const tvlUsd = stakedAmount * smaugPrice
      setTvl(`$${tvlUsd.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`)
    }

    if (stakeCountData !== undefined) {
      const count = typeof stakeCountData === 'bigint' ? Number(stakeCountData) : stakeCountData
      setStakeCountValue(count)
    }

    setIsLoading(false)
  }, [totalStakedData, stakeCountData, smaugPrice])

  return {
    tvl,
    stakeCount: stakeCountValue,
    isLoading,
  }
}
