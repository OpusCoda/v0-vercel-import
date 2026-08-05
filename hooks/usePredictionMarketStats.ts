import { useReadContract } from "wagmi"
import { predictionMarketAbi } from "@/lib/abis/prediction-market"
const PREDICTION_MARKET_ADDRESS = "0x3CE1D7142259237519Ed41D6b4d95690457427C6"
export interface PredictionMarketStats {
  cumulativeVolume: bigint
  resolvedMarketCount: bigint
  voidedMarketCount: bigint
  marketCount: bigint
  totalTrades: bigint
}
/**
 * Global Probability Shop statistics, read straight from the contract's
 * public state counters. Cheap — five scalar reads, polled every 30s.
 * Open-market count is derived elsewhere from useAllMarkets (status-aware);
 * this hook covers the cumulative on-chain counters.
 */
export function usePredictionMarketStats(): PredictionMarketStats {
  const base = {
    address: PREDICTION_MARKET_ADDRESS as `0x${string}`,
    abi: predictionMarketAbi,
    query: { refetchInterval: 30000 },
  } as const
  const { data: cumulativeVolume } = useReadContract({ ...base, functionName: "cumulativeVolume" })
  const { data: resolvedMarketCount } = useReadContract({ ...base, functionName: "resolvedMarketCount" })
  const { data: voidedMarketCount } = useReadContract({ ...base, functionName: "voidedMarketCount" })
  const { data: marketCount } = useReadContract({ ...base, functionName: "marketCount" })
  const { data: totalTrades } = useReadContract({ ...base, functionName: "totalTrades" })
  return {
    cumulativeVolume: (cumulativeVolume as bigint) ?? 0n,
    resolvedMarketCount: (resolvedMarketCount as bigint) ?? 0n,
    voidedMarketCount: (voidedMarketCount as bigint) ?? 0n,
    marketCount: (marketCount as bigint) ?? 0n,
    totalTrades: (totalTrades as bigint) ?? 0n,
  }
}