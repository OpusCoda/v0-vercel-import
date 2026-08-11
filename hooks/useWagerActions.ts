import { useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi'
import { WAGER_MARKET_ADDRESS, WAGER_MARKET_ABI } from '@/lib/wager-market'

/**
 * Write actions for a wager:
 *   - acceptWager(wagerId)                     challenger accepts an open wager (payable)
 *   - cancelWager(wagerId)                     creator cancels a still-open wager
 *   - submitVote(wagerId, winner)              standard, after eventDate
 *   - proposeEarlyResolution(wagerId, winner)  standard, before eventDate (new contract only)
 *   - resolvePriceBet(wagerId)                 price bet, after eventDate (permissionless)
 *
 * Returns a single tx-status surface so the card can show one banner.
 *
 * acceptWager is payable: the required value is not fixed, it is read live from
 * requiredAcceptanceAmount(wagerId).totalRequired at click time (Option A —
 * lazy read on click) and sent as msg.value. referrer is passed as the zero
 * address here; the referral binding for wagers happens on creation, not accept.
 */
const ZERO = '0x0000000000000000000000000000000000000000' as const

export function useWagerActions() {
  const { writeContract, data: txHash, isPending, error, reset } = useWriteContract()
  const publicClient = usePublicClient()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: !!txHash },
  })

  async function acceptWager(wagerId: bigint) {
    reset()
    if (!publicClient) return
    // Lazy read: fetch the exact amount to send for THIS wager, then submit.
    const result = (await publicClient.readContract({
      address: WAGER_MARKET_ADDRESS,
      abi: WAGER_MARKET_ABI,
      functionName: 'requiredAcceptanceAmount',
      args: [wagerId],
    })) as readonly [bigint, bigint, bigint]
    const totalRequired = result[2]
    writeContract({
      address: WAGER_MARKET_ADDRESS,
      abi: WAGER_MARKET_ABI,
      functionName: 'acceptWager',
      args: [wagerId, ZERO],
      value: totalRequired,
    })
  }

  function cancelWager(wagerId: bigint) {
    reset()
    writeContract({
      address: WAGER_MARKET_ADDRESS,
      abi: WAGER_MARKET_ABI,
      functionName: 'cancelWager',
      args: [wagerId],
    })
  }

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

  return {
    acceptWager,
    cancelWager,
    submitVote,
    proposeEarlyResolution,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    reset,
  }
}