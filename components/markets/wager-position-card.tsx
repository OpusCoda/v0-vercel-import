"use client"

import { useAccount, useReadContract } from "wagmi"
import { WAGER_MARKET_ADDRESS, WAGER_MARKET_ABI } from "@/lib/wager-market"
import type { WagerDetails } from "@/hooks/useOpenWagers"
import { WagerActions } from "@/components/markets/wager-actions"

const ZERO = "0x0000000000000000000000000000000000000000"

function plsNum(v: bigint): number {
  return Number(v) / 1e18
}
function fmtPls(v: number): string {
  return v.toLocaleString(undefined, { maximumFractionDigits: 0 }) + " PLS"
}
function shortAddr(a?: string): string {
  if (!a || a === ZERO) return "—"
  return `${a.slice(0, 6)}…${a.slice(-4)}`
}
function eventDateLabel(ts: bigint): string {
  return new Date(Number(ts) * 1000).toLocaleString("en-GB", {
    timeZone: "UTC",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }) + " UTC"
}

// One line of the field grid.
function Field({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="font-sans text-xs text-[#7c7a76]">{label}</span>
      <span className={`font-sans text-xs ${strong ? "font-semibold text-[#B87333]" : "text-[#e8e6e3]"}`}>
        {value}
      </span>
    </div>
  )
}

/**
 * A single active wager the connected user is party to, shown as a card:
 * stakes on both sides, the 5% vote deposit, net potential payout (from
 * quoteWager), event date, and a state-driven "what happens next" line that
 * doubles as the action surface (Accept / Vote / etc. via WagerActions).
 *
 * Status enum: 0 Created, 1 Active, 2 Voting, 3 Resolved, 4 Arbitration.
 */
export function WagerPositionCard({ w }: { w: WagerDetails }) {
  const { address } = useAccount()
  const me = address?.toLowerCase()
  const isCreator = !!me && w.creator.toLowerCase() === me
  const isChallenger = !!me && w.challenger.toLowerCase() === me

  const myStake = isCreator ? w.creatorStake : w.challengerStake
  const oppStake = isCreator ? w.challengerStake : w.creatorStake
  const myVoteDeposit = isCreator ? w.creatorVoteDeposit : w.challengerVoteDeposit
  const opponent = isCreator ? w.challenger : w.creator

  // Net winner payout (pot minus protocol fee), read from the contract.
  const { data: quoteData } = useReadContract({
    address: WAGER_MARKET_ADDRESS,
    abi: WAGER_MARKET_ABI,
    functionName: "quoteWager",
    args: [w.id],
    query: { enabled: true },
  })
  // quoteWager returns [totalPot, creatorFee, challengerFee, winnerPayout]
  const netPayout = quoteData ? plsNum((quoteData as readonly bigint[])[3]) : undefined

  const now = Math.floor(Date.now() / 1000)
  const eventTs = Number(w.eventDate)
  const votingTs = Number(w.votingDeadline)

  // State-driven "what happens next" line.
  const next = (() => {
    if (w.status === 0) {
      if (w.challenger === ZERO) return "Waiting for a challenger to accept."
      return "Waiting for the assigned challenger to accept."
    }
    if (w.status === 1 || w.status === 2) {
      if (now < eventTs) {
        const days = Math.max(0, Math.floor((eventTs - now) / 86400))
        return days >= 1 ? `Event in ${days} day${days === 1 ? "" : "s"}.` : "Event is today."
      }
      if (now <= votingTs) {
        const myVote = isCreator ? w.creatorVote : w.challengerVote
        const oppVote = isCreator ? w.challengerVote : w.creatorVote
        if (!myVote || myVote === ZERO) {
          const oppVoted = oppVote && oppVote !== ZERO
          return oppVoted ? "Opponent has voted — cast your vote." : "Event has occurred — cast your vote."
        }
        return "Your vote is in — waiting on your opponent."
      }
      return "Voting window closed — awaiting resolution."
    }
    if (w.status === 4) return "In arbitration — the panel is deciding."
    return "Active."
  })()

  return (
    <div className="rounded-lg border border-[#2a2a35] bg-[#0d0d12] p-4">
      {/* Description + what-happens-next (the dominant line) */}
      <div className="mb-3">
        <p className="font-sans text-sm font-semibold text-[#e8e6e3]">{w.description}</p>
        <p className="mt-1 font-sans text-xs font-semibold text-[#B87333]">{next}</p>
      </div>

      {/* Opponent */}
      <div className="mb-2 flex items-center justify-between border-t border-[#2a2a35] pt-2">
        <span className="font-sans text-xs text-[#7c7a76]">Opponent</span>
        <span className="font-mono text-xs text-[#b8b6b1]">{shortAddr(opponent)}</span>
      </div>

      {/* Field grid */}
      <div className="border-t border-[#2a2a35] pt-1">
        <Field label="Your stake" value={fmtPls(plsNum(myStake))} />
        <Field label="Opponent's stake" value={fmtPls(plsNum(oppStake))} />
        <Field label="Vote deposit" value={fmtPls(plsNum(myVoteDeposit))} />
        <Field
          label="Potential payout"
          value={netPayout !== undefined ? fmtPls(netPayout) : "—"}
          strong
        />
        <Field label="Event date" value={eventDateLabel(w.eventDate)} />
      </div>

      {/* Vote-deposit explainer, only while it matters (pre-resolution) */}
      {myVoteDeposit > 0n && (
        <p className="mt-2 font-sans text-[10px] leading-relaxed text-[#7c7a76]">
          Vote deposit is returned if your vote matches the final outcome, forfeited if you vote
          wrong or don't vote.
        </p>
      )}

      {/* Action surface — Accept / Vote / etc. depending on state */}
      {(isCreator || isChallenger) && (
        <div className="mt-3">
          <WagerActions wagerId={w.id} />
        </div>
      )}
    </div>
  )
}