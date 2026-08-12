"use client"
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { predictionMarketAbi } from "@/lib/abis/prediction-market"
const PREDICTION_MARKET_ADDRESS = "0x302Ab8bdc02235CB9b428DE1EDA6A978A819B691"
// Which claim function applies for a resolved/voided/abandoned market.
export type ClaimKind = "winnings" | "voidRefund" | "abandoned" | "residual"
const FN_BY_KIND: Record<ClaimKind, "claim" | "claimVoidRefund" | "claimAbandoned" | "claimResidualLiquidity"> = {
  winnings: "claim",
  voidRefund: "claimVoidRefund",
  abandoned: "claimAbandoned",
  residual: "claimResidualLiquidity",
}
/**
 * Claim from the Probability Shop for one market. The caller picks the kind
 * based on the position's claim flags (canClaimWinnings → "winnings", etc.).
 * Each maps to the matching contract function; all take a single marketId.
 */
export function useMarketClaim() {
  const { data: hash, writeContract, isPending, error: writeError, reset } = useWriteContract()
  const { isLoading: isConfirming, isSuccess, error: receiptError } =
    useWaitForTransactionReceipt({ hash })
  function claim(marketId: bigint, kind: ClaimKind) {
    writeContract({
      address: PREDICTION_MARKET_ADDRESS as `0x${string}`,
      abi: predictionMarketAbi,
      functionName: FN_BY_KIND[kind],
      args: [marketId],
    }, {
      onError: (err) => console.error("writeContract error:", err),
      onSuccess: (hash) => console.log("writeContract submitted:", hash),
    })
  }
  return {
    claim,
    isPending,
    isConfirming,
    isSuccess,
    reset,
    writeError: writeError ?? receiptError,
  }
}