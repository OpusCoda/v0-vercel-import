import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { WAGER_MARKET_ADDRESS, WAGER_MARKET_ABI } from '@/lib/wager-market'

/**
 * Write actions for resolving a wager:
 *   - submitVote(wagerId, winner)            standard, after eventDate
 *   - proposeEarlyResolution(wagerId, winner) standard, before eventDate (new contract only)
 *   - resolvePriceBet(wagerId)               price bet, after eventDate (permissionless)
 *
 * Returns a single tx-status surface so the card can show one banner.
 */
export function useWagerActions() {
  const { writeContract, data: txHash, isPending, error, reset } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: !!txHash },
  })

  function submitVote(wagerId: bigint, winner: `0x${string}`) {
    reset()
    writeContract({
      address: WAGER_MARKET_ADDRESS,
      abi: WAGER_MARKET_ABI,
      functionName: 'submitVote',
      args: [wagerId, winner],
    })
  }

  function proposeEarlyResolution(wagerId: bigint, winner: `0x${string}`) {
    reset()
    writeContract({
      address: WAGER_MARKET_ADDRESS,
      abi: WAGER_MARKET_ABI,
      functionName: 'proposeEarlyResolution',
      args: [wagerId, winner],
    })
  }

  function resolvePriceBet(wagerId: bigint) {
    reset()
    writeContract({
      address: WAGER_MARKET_ADDRESS,
      abi: WAGER_MARKET_ABI,
      functionName: 'resolvePriceBet',
      args: [wagerId],
    })
  }

  return {
    submitVote,
    proposeEarlyResolution,
    resolvePriceBet,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    reset,
  }
}