"use client"
import { useState } from "react"
import { useAccount, useReadContract } from "wagmi"
import { BuySection } from "@/components/markets/buy-section"
import { useAcceptWager } from "@/hooks/useAcceptWager"
import { useCancelWager } from "@/hooks/useCancelWager"
import { WAGER_MARKET_ADDRESS, WAGER_MARKET_ABI } from "@/lib/wager-market"
import { WagerActions } from "@/components/markets/wager-actions"
export type ProbabilityOutcome = {
  label: string
  odds: number // percentage 0-100
}
export type P2PSide = {
  label: string
  staked: number
  wins: number
  isTaken: boolean
}
export type MarketCardProps =
  | {
    type: "probability"
    id?: string
    icon?: string
    title: string
    status?: "Open" | "Awaiting" | "Resolved"
    yesOdds: number
    noOdds: number
    volumePls?: number
    liquidityPls?: number
    bettingDeadline?: number
    resolutionDeadline?: number
    resolutionCriteria?: string
    source?: string
  }
  | {
    type: "p2p"
    id: string
    icon?: string
    betType: string
    description: string
    deadline: string
    category: string
    yesData: P2PSide
    noData: P2PSide
    closesIn: string
    creator?: string
    isPriceBet?: boolean
    creatorBetsAbove?: boolean
    targetPrice?: number
    tokenLabel?: string
    status?: 'open' | 'active' | 'closed'
    eventDateTs?: number
    winnerShort?: string
  }
function pls(v: bigint): number {
  return Number(v) / 1e18
}
// Human label for time until resolution opens (the event date).
// Standard wagers open VOTING at eventDate; price bets become RESOLVABLE.
function resolutionLabel(eventDateTs: number | undefined, isPriceBet: boolean | undefined): string {
  if (!eventDateTs) return "Matched — awaiting resolution"
  const secs = eventDateTs - Math.floor(Date.now() / 1000)
  if (secs <= 0) {
    return isPriceBet ? "Ready to resolve" : "Voting open"
  }
  const days = Math.floor(secs / 86400)
  const hours = Math.floor((secs % 86400) / 3600)
  let left: string
  if (days >= 1) left = `${days}d ${hours}h`
  else if (hours >= 1) left = `${hours}h`
  else left = `${Math.max(1, Math.floor(secs / 60))}m`
  return isPriceBet ? `Resolves in ${left}` : `Voting opens in ${left}`
}
// Live accept button + accurate payout via quoteWager.
function AcceptSection({
  id,
  creatorStake,
  takerStake,
  creator,
  isPriceBet,
  creatorBetsAbove,
  targetPrice,
  tokenLabel,
}: {
  id: string
  creatorStake: number
  takerStake: number
  creator?: string
  isPriceBet?: boolean
  creatorBetsAbove?: boolean
  targetPrice?: number
  tokenLabel?: string
}) {
  const { address, isConnected } = useAccount()
  const wagerId = (() => {
    try { return BigInt(id) } catch { return undefined }
  })()
  // Accurate winner payout (net of fees) from the contract.
  const { data: quoteData } = useReadContract({
    address: WAGER_MARKET_ADDRESS,
    abi: WAGER_MARKET_ABI,
    functionName: "quoteWager",
    args: wagerId !== undefined ? [wagerId] : undefined,
    query: { enabled: wagerId !== undefined },
  })
  // quoteWager returns [totalPot, creatorFee, challengerFee, winnerPayout]
  const winnerPayout = quoteData ? pls((quoteData as readonly bigint[])[3]) : undefined
  const {
    accept,
    isPending,
    isConfirming,
    isSuccess,
    requiredLoading,
    writeError,
  } = useAcceptWager(wagerId)
  const {
    cancel,
    isPending: cancelPending,
    isConfirming: cancelConfirming,
    isSuccess: cancelSuccess,
    writeError: cancelError,
  } = useCancelWager(wagerId)
  const isCreator =
    !!address && !!creator && address.toLowerCase() === creator.toLowerCase()
  const disabled =
    !isConnected || isCreator || requiredLoading || isPending || isConfirming || isSuccess
  let btnLabel: string
  if (!isConnected) btnLabel = "Connect wallet to accept"
  else if (isCreator) btnLabel = "You created this wager"
  else if (isSuccess) btnLabel = "Accepted ✓"
  else if (isPending) btnLabel = "Confirm in wallet..."
  else if (isConfirming) btnLabel = "Accepting..."
  else if (requiredLoading) btnLabel = "Loading..."
  else btnLabel = `Accept — put in ${takerStake.toLocaleString()} PLS`
  // Profit = payout minus what the taker puts in.
  const profit = winnerPayout !== undefined ? winnerPayout - takerStake : undefined
  // Cancel button state (creator only)
  let cancelLabel = "Cancel wager (refund)"
  if (cancelSuccess) cancelLabel = "Cancelled ✓"
  else if (cancelPending) cancelLabel = "Confirm in wallet..."
  else if (cancelConfirming) cancelLabel = "Cancelling..."
  const cancelDisabled = cancelPending || cancelConfirming || cancelSuccess
  return (
    <div className="mb-3">
      {isCreator ? (
        // Creator view: offer cancellation (only possible while unaccepted).
        <>
          <button
            onClick={() => cancel()}
            disabled={cancelDisabled}
            className="w-full bg-[#1a1a20] hover:bg-red-500/10 text-red-400 font-sans text-xs font-semibold py-2 rounded transition-colors border border-red-500/30 hover:border-red-500/60 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelLabel}
          </button>
          <p className="mt-1 text-center font-sans text-[10px] text-[#7c7a76]">
            You created this wager. You can cancel and be refunded until someone accepts.
          </p>
          {cancelError && (
            <p className="mt-1 font-sans text-[10px] text-red-400">
              {cancelError.message.includes("already accepted")
                ? "Too late — this wager has already been accepted."
                : "Cancel failed — see wallet for details."}
            </p>
          )}
        </>
      ) : (
        // Taker view: payout + accept.
        <>
          {/* Payout line */}
          <div className="mb-2 text-center">
            {winnerPayout !== undefined ? (
              <p className="font-sans text-xs text-[#b8b6b1]">
                If you win, you receive{" "}
                <span className="text-[#d4af37] font-semibold">
                  {winnerPayout.toLocaleString(undefined, { maximumFractionDigits: 0 })} PLS
                </span>
                {profit !== undefined && profit > 0 && (
                  <> (+{profit.toLocaleString(undefined, { maximumFractionDigits: 0 })} profit)</>
                )}
              </p>
            ) : (
              <p className="font-sans text-xs text-[#7c7a76]">Calculating payout…</p>
            )}
          </div>
          <button
            onClick={() => accept()}
            disabled={disabled}
            className="w-full bg-[#1a1a20] hover:bg-[#2a2a35] text-[#d4af37] font-sans text-xs font-semibold py-2 rounded transition-colors border border-[#d4af37]/30 hover:border-[#d4af37]/60 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {btnLabel}
          </button>
          <p className="mt-1 text-center font-sans text-[10px] text-[#7c7a76]">
            A small protocol fee is deducted from winnings at resolution.
          </p>
          {writeError && (
            <p className="mt-1 font-sans text-[10px] text-red-400">
              {writeError.message.includes("Creator cannot accept")
                ? "You can't accept your own wager."
                : writeError.message.includes("Arbitration panel not ready")
                ? "Arbitration panel not ready (needs 3 arbitrators)."
                : writeError.message.includes("Deposit window expired")
                ? "This wager's acceptance window has expired."
                : "Transaction failed — see wallet for details."}
            </p>
          )}
        </>
      )}
    </div>
  )
}
// Relative label when < 24h away, absolute (local) date beyond that.
function deadlineLabel(status: string | undefined, bettingTs?: number, resolutionTs?: number): string | null {
  const now = Math.floor(Date.now() / 1000)
  if (status === "Open" && bettingTs) {
    const secs = bettingTs - now
    if (secs <= 0) return "Closing…"
    return "Closes " + humanWhen(bettingTs, secs)
  }
  if (status === "Awaiting" && resolutionTs) {
    const secs = resolutionTs - now
    if (secs <= 0) return "Resolution open"
    return "Resolves " + humanWhen(resolutionTs, secs)
  }
  return null
}

function humanWhen(ts: number, secs: number): string {
  // Under 24h → relative ("in 3h 27m"); otherwise absolute UTC date.
  if (secs < 86400) {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    if (h >= 1) return `in ${h}h ${m}m`
    if (m >= 1) return `in ${m}m`
    return "in <1m"
  }
  return new Date(ts * 1000).toLocaleString("en-GB", {
    timeZone: "UTC",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }) + " UTC"
}

// Build the X (Twitter) share intent URL for an open market.
function shareOnX(title: string, yesOdds: number, noOdds: number) {
  const text = `${title}\n\nYes ${yesOdds}% · No ${noOdds}% — trade it on the Opus Probability Shop:`
  const url = typeof window !== "undefined" ? window.location.href : "https://opuseco.com/markets"
  const intent =
    "https://twitter.com/intent/tweet?text=" +
    encodeURIComponent(text) +
    "&url=" +
    encodeURIComponent(url)
  if (typeof window !== "undefined") window.open(intent, "_blank", "noopener,noreferrer")
}

// Binary YES/NO market card with an inline buy panel per side.
function ProbabilityCard(props: Extract<MarketCardProps, { type: "probability" }>) {
  const [openSide, setOpenSide] = useState<null | boolean>(null)

  const fmtPls = (v?: number) =>
    v === undefined ? undefined : Math.round(v).toLocaleString()
  const vol = fmtPls(props.volumePls)
  const liq = fmtPls(props.liquidityPls)
  const timing = deadlineLabel(props.status, props.bettingDeadline, props.resolutionDeadline)

  const marketId = (() => {
    try { return props.id !== undefined ? BigInt(props.id) : undefined } catch { return undefined }
  })()

  // Trading is only possible while the market is Open.
  const tradable = props.status === "Open" && marketId !== undefined

  return (
    <div className="flex flex-col rounded-xl border border-[#2a2a35] bg-[#101017] p-4 transition-colors hover:border-[#d4af37]/30">
      {/* Header: icon + question, status badge */}
      <div className="flex items-start justify-between gap-3 pb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{props.icon || "📊"}</span>
          <h3 className="font-sans text-sm font-semibold text-[#e8e6e3] line-clamp-2">{props.title}</h3>
        </div>
        {props.status && (
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 font-sans text-[10px] font-semibold ${
              props.status === "Open"
                ? "bg-green-400/10 text-green-400 border border-green-400/30"
                : props.status === "Resolved"
                  ? "bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/30"
                  : "bg-[#7c7a76]/10 text-[#b8b6b1] border border-[#7c7a76]/30"
            }`}
          >
            {props.status}
          </span>
        )}
      </div>

      {/* Single row: odds on the left, buy buttons on the right */}
      <div className="flex items-center justify-between gap-3 border-t border-[#2a2a35] pt-3">
        <div className="font-sans text-sm text-[#b8b6b1]">
          <span className="font-semibold text-green-400">Yes {props.yesOdds}%</span>
          <span className="mx-2 text-[#7c7a76]">·</span>
          <span className="font-semibold text-red-400">No {props.noOdds}%</span>
        </div>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => tradable && setOpenSide((s) => (s === true ? null : true))}
            disabled={!tradable}
            className="rounded px-3 py-1 font-sans text-[11px] font-semibold text-green-400 hover:bg-green-400/10 border border-green-400/30 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Buy Yes
          </button>
          <button
            onClick={() => tradable && setOpenSide((s) => (s === false ? null : false))}
            disabled={!tradable}
            className="rounded px-3 py-1 font-sans text-[11px] font-semibold text-red-400 hover:bg-red-400/10 border border-red-400/30 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Buy No
          </button>
        </div>
      </div>

      {/* Inline buy panel for the chosen side */}
      {tradable && openSide !== null && marketId !== undefined && (
        <BuySection
          marketId={marketId}
          side={openSide}
          onClose={() => setOpenSide(null)}
        />
      )}

      {/* Footer: volume + liquidity (left) · deadline (right) */}
      {(vol || liq || timing) && (
        {(props.resolutionCriteria || props.source || props.resolutionDeadline) && (
  <details className="mt-3 rounded-lg border border-[#2a2a35] bg-[#0d0d12] p-3">
    <summary className="cursor-pointer font-sans text-[11px] font-semibold text-[#d4af37]">
      Resolution details
    </summary>
    <div className="mt-2 space-y-2 font-sans text-[11px] leading-relaxed text-[#b8b6b1]">
      {props.resolutionCriteria && (
        <p className="whitespace-pre-line">{props.resolutionCriteria}</p>
      )}
      {props.source && (
        <p>
          <span className="text-[#7c7a76]">Source: </span>
          {props.source.startsWith("http") ? (
            <a href={props.source} target="_blank" rel="noopener noreferrer"
               className="text-[#d4af37] underline break-all">{props.source}</a>
          ) : props.source}
        </p>
      )}
      {props.resolutionDeadline && (
        <p>
          <span className="text-[#7c7a76]">Resolution opens: </span>
          {humanWhen(props.resolutionDeadline, props.resolutionDeadline - Math.floor(Date.now() / 1000))}
        </p>
      )}
    </div>
  </details>
)}
        <div className="mt-3 flex items-center justify-between gap-2 font-sans text-[11px] text-[#7c7a76]">
          <span>
            {vol && <>{vol} PLS Vol</>}
            {vol && liq && <span className="mx-1">·</span>}
            {liq && <>{liq} PLS Liquidity</>}
          </span>
          {timing && <span className="shrink-0">{timing}</span>}
        </div>
      )}

      {/* Share on X — only for open markets */}
      {props.status === "Open" && (
        <button
          onClick={() => shareOnX(props.title, props.yesOdds, props.noOdds)}
          className="mt-3 w-full rounded border border-[#2a2a35] py-1.5 font-sans text-[11px] font-semibold text-[#b8b6b1] transition-colors hover:border-[#d4af37]/50 hover:text-[#d4af37]"
        >
          Share on X
        </button>
      )}
    </div>
  )
}

export function MarketCard(props: MarketCardProps) {
  if (props.type === "probability") {
    return <ProbabilityCard {...props} />
  }
  // P2P Market card. Creator side is taken; the other side is open to accept.
  const creatorStake = props.yesData.staked
  const takerStake = props.noData.staked
  // Describe each side's position.
  // For price bets, show the directional opposite explicitly.
  const creatorPosition =
    props.isPriceBet && props.tokenLabel
      ? `${props.tokenLabel} ${props.creatorBetsAbove ? "above" : "below"} $${props.targetPrice}`
      : "Backs this outcome"
  const takerPosition =
    props.isPriceBet && props.tokenLabel
      ? `${props.tokenLabel} ${props.creatorBetsAbove ? "below" : "above"} $${props.targetPrice}`
      : "Backs the opposite outcome"
  return (
    <div className="flex flex-col rounded-xl border border-[#2a2a35] bg-[#101017] p-4 transition-colors hover:border-[#d4af37]/30">
      {/* Header */}
      <div className="flex items-start justify-between pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{props.icon || "🎯"}</span>
          <h3 className="font-sans text-xs font-bold text-[#d4af37]">{props.betType}</h3>
        </div>
        <span className="font-sans text-xs text-[#d4af37] bg-[#1a1a20] px-2 py-1 rounded">{props.category}</span>
      </div>
      {/* Description + deadline */}
      <div className="pb-3 space-y-1">
        <p className="font-sans text-sm font-semibold text-[#e8e6e3]">{props.description}</p>
        <p className="font-sans text-xs text-[#b8b6b1]">{props.deadline}</p>
      </div>
      <div className="border-t border-[#2a2a35] my-3" />
      {/* Two sides: creator (taken) vs. you (open) */}
      <div className="grid grid-cols-2 gap-4 pb-3">
        {/* Creator */}
        <div className="flex flex-col">
          <span className="font-sans text-xs font-bold text-[#e8e6e3] mb-1">Creator's position</span>
          <span className="font-sans text-xs text-[#b8b6b1]">{creatorPosition}</span>
          <span className="font-sans text-xs text-[#9ca3af] mt-1">Bet: {creatorStake.toLocaleString()} PLS</span>
        </div>
        {/* You / acceptor */}
        <div className="flex flex-col">
          <span className="font-sans text-xs font-bold text-[#e8e6e3] mb-1">
            {props.status === "open" ? "Your position if you accept" : "Acceptor's side"}
          </span>
          <span className="font-sans text-xs text-[#b8b6b1]">{takerPosition}</span>
          <span className="font-sans text-xs text-[#9ca3af] mt-1">Bet: {takerStake.toLocaleString()} PLS</span>
        </div>
      </div>
      <div className="border-t border-[#2a2a35] my-3" />
      {props.status === "open" ? (
        <>
          {/* Payout + accept */}
          <AcceptSection
            id={props.id}
            creatorStake={creatorStake}
            takerStake={takerStake}
            creator={props.creator}
            isPriceBet={props.isPriceBet}
            creatorBetsAbove={props.creatorBetsAbove}
            targetPrice={props.targetPrice}
            tokenLabel={props.tokenLabel}
          />
          <p className="font-sans text-xs text-[#7c7a76]">Time left to accept: {props.closesIn}</p>
        </>
      ) : (
        <div className="mb-1 text-center">
          {props.status === "active" ? (
            (() => {
              let wid: bigint | undefined
              try { wid = BigInt(props.id) } catch { wid = undefined }
              return wid !== undefined ? (
                <WagerActions wagerId={wid} />
              ) : (
                <span className="inline-block rounded-full border border-[#2a2a35] bg-[#1a1a20] px-3 py-1 font-sans text-xs font-semibold text-[#b8b6b1]">
                  {resolutionLabel(props.eventDateTs, props.isPriceBet)}
                </span>
              )
            })()
          ) : (
            <div className="flex flex-col items-center gap-1">
              <span className="inline-block rounded-full border border-[#2a2a35] bg-[#1a1a20] px-3 py-1 font-sans text-xs font-semibold text-[#b8b6b1]">
                Closed
              </span>
              {props.winnerShort && (
                <span className="font-sans text-[10px] text-[#7c7a76]">
                  Winner: <span className="font-mono text-[#d4af37]">{props.winnerShort}</span>
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}