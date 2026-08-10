"use client"
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { predictionMarketAbi } from "@/lib/abis/prediction-market"
const PREDICTION_MARKET_ADDRESS = "0x77b004A0029d725e353E5EE0D80102516A4e52a8"
/**
 * Owner-only: sweep a resolved market's remaining balance after the 90-day
 * unclaimed window. Splits 50% stakers / 50% dev on-chain. One marketId.
 * The caller is responsible for only enabling this once the window has passed
 * (the contract also enforces it, reverting SweepWindowOpenErr otherwise).
 */
export function useSweepUnclaimed() {
  const { data: hash, writeContract, isPending, error: writeError, reset } = useWriteContract()
  const { isLoading: isConfirming, isSuccess, error: receiptError } =
    useWaitForTransactionReceipt({ hash })
  function sweep(marketId: bigint) {
    writeContract({
      address: PREDICTION_MARKET_ADDRESS as `0x${string}`,
      abi: predictionMarketAbi,
      functionName: "sweepUnclaimed",
      args: [marketId],
    }, {
      onError: (err) => console.error("sweepUnclaimed error:", err),
      onSuccess: (h) => console.log("sweepUnclaimed submitted:", h),
    })
  }
  return {
    sweep,
    isPending,
    isConfirming,
    isSuccess,
    reset,
    writeError: writeError ?? receiptError,
  }
}