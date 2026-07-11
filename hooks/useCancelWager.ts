import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { WAGER_MARKET_ADDRESS, WAGER_MARKET_ABI } from '@/lib/wager-market'

/**
 * Cancel flow for a wager the connected user created, before anyone accepts.
 *
 * Contract rule (cancelWager): status must be Created (unaccepted), and the
 * caller must be the creator (owner, or anyone after depositDeadline, can also
 * trigger it — but the UI only offers this to the creator on open wagers).
 * Refunds creatorStake + creatorVoteDeposit. No fee on cancellation.
 */
export function useCancelWager(wagerId: bigint | undefined) {
  const { writeContract, data: txHash, isPending, error: writeError, reset } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: !!txHash },
  })

  function cancel() {
    if (wagerId === undefined) return
    writeContract({
      address: WAGER_MARKET_ADDRESS,
      abi: WAGER_MARKET_ABI,
      functionName: 'cancelWager',
      args: [wagerId],
    })
  }

  return {
    cancel,
    isPending,      // waiting for wallet signature
    isConfirming,   // mined, confirming
    isSuccess,      // cancelled
    writeError,
    reset,
  }
}