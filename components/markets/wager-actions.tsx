'use client'
import { useEffect } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { WAGER_MARKET_ADDRESS, WAGER_MARKET_ABI } from '@/lib/wager-market'
import { useWagerActions } from '@/hooks/useWagerActions'
const ZERO = '0x0000000000000000000000000000000000000000'
// On-chain Status enum: 0 Created,1 Active,2 Voting,3 Resolved,4 Arbitration,5 Cancelled,6 Voided
// WagerType: 0 STANDARD, 1 PRICE_BET
function short(a?: string) {
  return a ? `${a.slice(0, 6)}…${a.slice(-4)}` : ''
}
/**
 * Self-contained resolution controls for a single wager.
 * Reads live state from getWagerDetails and shows the right action:
 *   - Price bet, past eventDate, Active         → "Resolve now" (anyone)
 *   - Standard, in voting window, party         → vote buttons
 *   - Standard, before eventDate, party         → early-resolution buttons (if enabled)
 *   - otherwise                                 → a small status line
 */
export function WagerActions({ wagerId }: { wagerId: bigint }) {
  const { address } = useAccount()
  const { openConnectModal } = useConnectModal()
  const {
    submitVote,
    proposeEarlyResolution,
    resolvePriceBet,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  } = useWagerActions()
  const { data, refetch } = useReadContract({
    address: WAGER_MARKET_ADDRESS,
    abi: WAGER_MARKET_ABI,
    functionName: 'getWagerDetails',
    args: [wagerId],
    query: { refetchInterval: 15000 },
  })
  // Refresh once a tx confirms (effect, not inline in render).
  useEffect(() => {
    if (isConfirmed) refetch()
  }, [isConfirmed, refetch])
  if (!data) return null
  const res = data as any
  const w = res[0]
  const status = Number(w.status)
  const wagerType = Number(w.wagerType)
  const creator = w.creator as string
  const challenger = w.challenger as string
  const eventDate = Number(w.eventDate)
  const votingDeadline = Number(w.votingDeadline)
  const creatorVote = w.creatorVote as string
  const challengerVote = w.challengerVote as string
  const now = Math.floor(Date.now() / 1000)
  const me = address?.toLowerCase()
  const isCreator = !!me && me === creator.toLowerCase()
  const isChallenger = !!me && me === challenger.toLowerCase()
  const isParty = isCreator || isChallenger
  const myVote = isCreator ? creatorVote : isChallenger ? challengerVote : ZERO
  const iVoted = myVote && myVote !== ZERO
  // Shared tx-status line
  const statusLine = isPending ? (
    <p className="text-xs text-[#D8B13D]">Confirm in wallet…</p>
  ) : isConfirming ? (
    <p className="text-xs text-[#D8B13D]">Submitting to the blockchain…</p>
  ) : isConfirmed ? (
    <p className="text-xs text-green-400">Done — updating…</p>
  ) : error ? (
    <p className="text-xs text-red-400">
      {error.message.includes('User rejected') || error.message.includes('denied')
        ? 'Rejected in wallet.'
        : 'Transaction failed.'}
    </p>
  ) : null
  const busy = isPending || isConfirming
  // Run an action only if connected; otherwise open the wallet modal.
  const guarded = (fn: () => void) => () => {
    if (!address) { openConnectModal?.(); return }
    fn()
  }
  // ---- PRICE BET: resolvable by anyone once past eventDate ----
  if (wagerType === 1 && status === 1 && now > eventDate) {
    return (
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={guarded(() => resolvePriceBet(wagerId))}
          disabled={busy}
          className="rounded-lg bg-[#D8B13D] px-5 py-2 text-sm font-semibold text-black transition hover:bg-[#D8B13D]/90 disabled:opacity-50"
        >
          {busy ? 'Resolving…' : 'Resolve now (oracle)'}
        </button>
        {statusLine}
      </div>
    )
  }
  // ---- STANDARD: voting window (after eventDate, before votingDeadline) ----
  if (
    wagerType === 0 &&
    (status === 1 || status === 2) &&
    now >= eventDate &&
    now <= votingDeadline
  ) {
    if (!isParty) {
      return <div className="text-center text-sm text-[#9a9a9a]">Voting open — parties are deciding the winner</div>
    }
    if (iVoted) {
      return (
        <div className="text-center text-sm text-[#9a9a9a]">
          You voted for {myVote.toLowerCase() === creator.toLowerCase() ? 'the creator' : 'the acceptor'} — waiting for the other party
        </div>
      )
    }
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="text-xs text-[#9a9a9a]">Who won?</div>
        <div className="flex gap-2">
          <button
            onClick={guarded(() => submitVote(wagerId, creator as `0x${string}`))}
            disabled={busy}
            className="rounded-lg border border-[#D8B13D] px-4 py-2 text-sm font-semibold text-[#D8B13D] transition hover:bg-[#D8B13D]/10 disabled:opacity-50"
          >
            {'Creator won'}
          </button>
          <button
            onClick={guarded(() => submitVote(wagerId, challenger as `0x${string}`))}
            disabled={busy}
            className="rounded-lg border border-[#D8B13D] px-4 py-2 text-sm font-semibold text-[#D8B13D] transition hover:bg-[#D8B13D]/10 disabled:opacity-50"
          >
            {'Acceptor won'}
          </button>
        </div>
        {statusLine}
      </div>
    )
  }
  // ---- STANDARD: early resolution (before eventDate), party only ----
  if (
    wagerType === 0 &&
    status === 1 &&
    now < eventDate &&
    isParty
  ) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="text-xs text-[#9a9a9a]">Outcome already settled? Propose an early winner (resolves only if both agree)</div>
        <div className="flex gap-2">
          <button
            onClick={guarded(() => proposeEarlyResolution(wagerId, creator as `0x${string}`))}
            disabled={busy}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-[#f4f4f4] transition hover:bg-white/5 disabled:opacity-50"
          >
            {'Creator wins'}
          </button>
          <button
            onClick={guarded(() => proposeEarlyResolution(wagerId, challenger as `0x${string}`))}
            disabled={busy}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-[#f4f4f4] transition hover:bg-white/5 disabled:opacity-50"
          >
            {'Acceptor wins'}
          </button>
        </div>
        {statusLine}
      </div>
    )
  }
  // ---- Fallback status labels ----
  if (status === 4) return <div className="text-center text-sm text-amber-400">In arbitration</div>
  if (status === 3) return <div className="text-center text-sm text-[#9a9a9a]">Resolved</div>
  if (wagerType === 0 && now < eventDate) {
    return <div className="text-center text-sm text-[#9a9a9a]">Matched — voting opens after the event date</div>
  }
  return null
}