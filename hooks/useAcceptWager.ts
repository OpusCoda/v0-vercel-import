import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { WAGER_MARKET_ADDRESS, WAGER_MARKET_ABI } from '@/lib/wager-market'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const

/**
 * Accept flow for a single wager.
 *
 * - Reads requiredAcceptanceAmount(wagerId) for the EXACT msg.value the contract
 *   expects (standard = challengerStake + 5% vote deposit; price bet = stake only).
 * - Calls acceptWager(wagerId, referrer) with that value.
 * - Exposes pending / confirming / success / error so the button can reflect state.
 *
 * Note: the contract also requires arbitratorList.length >= 3 and that the caller
 * is not the creator; those revert at send time if unmet.
 */
export function useAcceptWager(wagerId: bigint | undefined) {
  // Exact amount to send. Returns [stake, voteDeposit, totalRequired].
  const {
    data: requiredData,
    isLoading: requiredLoading,
    error: requiredError,
  } = useReadContract({
    address: WAGER_MARKET_ADDRESS,
    abi: WAGER_MARKET_ABI,
    functionName: 'requiredAcceptanceAmount',
    args: wagerId !== undefined ? [wagerId] : undefined,
    query: { enabled: wagerId !== undefined },
  })

  const totalRequired = requiredData ? (requiredData as readonly bigint[])[2] : undefined

  const { writeContract, data: txHash, isPending, error: writeError, reset } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: !!txHash },
  })

  function accept(referrer?: `0x${string}`) {
    if (wagerId === undefined || totalRequired === undefined) return
    writeContract({
      address: WAGER_MARKET_ADDRESS,
      abi: WAGER_MARKET_ABI,
      functionName: 'acceptWager',
      args: [wagerId, referrer ?? ZERO_ADDRESS],
      value: totalRequired,
    })
  }

  return {
    accept,
    totalRequired,          // bigint | undefined — exact msg.value
    requiredLoading,
    requiredError,
    isPending,              // waiting for wallet signature / submission
    isConfirming,           // mined, waiting for confirmation
    isSuccess,              // accepted
    writeError,             // revert / rejection
    reset,
  }
}