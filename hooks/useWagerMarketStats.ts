import { useReadContract } from 'wagmi'
import { WAGER_MARKET_ADDRESS, WAGER_MARKET_ABI } from '@/lib/wager-market'

export interface WagerMarketStats {
  totalVolume: bigint
  totalResolved: bigint
  totalVoided: bigint
  totalProtocolFees: bigint
  totalStakerFees: bigint
  totalPayouts: bigint
  totalStandardWagers: bigint
  totalPriceBets: bigint
  openWagerCount: bigint
}

export function useWagerMarketStats() {
  const { data: totalVolume } = useReadContract({
    address: WAGER_MARKET_ADDRESS,
    abi: WAGER_MARKET_ABI,
    functionName: 'totalVolume',
    query: { refetchInterval: 30000 },
  })

  const { data: totalResolved } = useReadContract({
    address: WAGER_MARKET_ADDRESS,
    abi: WAGER_MARKET_ABI,
    functionName: 'totalResolved',
    query: { refetchInterval: 30000 },
  })

  const { data: totalVoided } = useReadContract({
    address: WAGER_MARKET_ADDRESS,
    abi: WAGER_MARKET_ABI,
    functionName: 'totalVoided',
    query: { refetchInterval: 30000 },
  })

  // These functions may not exist in the contract ABI - commented out temporarily
  // const { data: totalProtocolFees } = useReadContract({
  //   address: WAGER_MARKET_ADDRESS,
  //   abi: WAGER_MARKET_ABI,
  //   functionName: 'totalProtocolFees',
  //   query: { refetchInterval: 30000 },
  // })

  // const { data: totalStakerFees } = useReadContract({
  //   address: WAGER_MARKET_ADDRESS,
  //   abi: WAGER_MARKET_ABI,
  //   functionName: 'totalStakerFees',
  //   query: { refetchInterval: 30000 },
  // })

  // const { data: totalPayouts } = useReadContract({
  //   address: WAGER_MARKET_ADDRESS,
  //   abi: WAGER_MARKET_ABI,
  //   functionName: 'totalPayouts',
  //   query: { refetchInterval: 30000 },
  // })

  const { data: totalStandardWagers } = useReadContract({
    address: WAGER_MARKET_ADDRESS,
    abi: WAGER_MARKET_ABI,
    functionName: 'totalStandardWagers',
    query: { refetchInterval: 30000 },
  })

  const { data: totalPriceBets } = useReadContract({
    address: WAGER_MARKET_ADDRESS,
    abi: WAGER_MARKET_ABI,
    functionName: 'totalPriceBets',
    query: { refetchInterval: 30000 },
  })

  const { data: openWagerCount } = useReadContract({
    address: WAGER_MARKET_ADDRESS,
    abi: WAGER_MARKET_ABI,
    functionName: 'openWagerCount',
    query: { refetchInterval: 30000 },
  })

  return {
    totalVolume: totalVolume ?? 0n,
    totalResolved: totalResolved ?? 0n,
    totalVoided: totalVoided ?? 0n,
    // totalProtocolFees: totalProtocolFees ?? 0n,
    // totalStakerFees: totalStakerFees ?? 0n,
    // totalPayouts: totalPayouts ?? 0n,
    // totalStandardWagers: totalStandardWagers ?? 0n,
    totalPriceBets: totalPriceBets ?? 0n,
    openWagerCount: openWagerCount ?? 0n,
  } as WagerMarketStats
}
