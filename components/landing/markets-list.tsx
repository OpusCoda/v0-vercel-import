"use client"
import { useAccount, useReadContract } from "wagmi"
import { useAcceptWager } from "@/hooks/useAcceptWager"
import { WAGER_MARKET_ADDRESS, WAGER_MARKET_ABI } from "@/lib/wager-market"
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
    icon?: string
    title: string
    outcomes: ProbabilityOutcome[]
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
  return (
    <div className="mb-3">
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
    </div>
  )
}
export function MarketCard(props: MarketCardProps) {
  if (props.type === "probability") {
    return (
      <div className="flex flex-col rounded-xl border border-[#2a2a35] bg-[#101017] p-4 transition-colors hover:border-[#d4af37]/30">
        <div className="flex items-center gap-3 pb-4">
          <span className="text-2xl">{props.icon || "📊"}</span>
          <h3 className="font-sans text-sm font-semibold text-[#e8e6e3] line-clamp-2">{props.title}</h3>
        </div>
        <div className="space-y-2 border-t border-[#2a2a35] pt-3">
          {props.outcomes.map((outcome, idx) => (
            <div key={idx} className="flex items-center justify-between gap-2">
              <span className="font-sans text-xs text-[#b8b6b1] flex-1">{outcome.label}</span>
              <span className="font-sans text-xs font-semibold text-[#9ca3af] w-8 text-right">{outcome.odds}%</span>
              <div className="flex gap-1">
                <button className="rounded px-2 py-1 font-sans text-[10px] font-semibold text-green-400 hover:bg-green-400/10 border border-green-400/30">
                  Yes
                </button>
                <button className="rounded px-2 py-1 font-sans text-[10px] font-semibold text-red-400 hover:bg-red-400/10 border border-red-400/30">
                  No
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
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
        {/* You */}
        <div className="flex flex-col">
          <span className="font-sans text-xs font-bold text-[#e8e6e3] mb-1">Your position if you accept</span>
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
          <span className="inline-block rounded-full border border-[#2a2a35] bg-[#1a1a20] px-3 py-1 font-sans text-xs font-semibold text-[#b8b6b1]">
            {props.status === "active"
              ? resolutionLabel(props.eventDateTs, props.isPriceBet)
              : "Closed"}
          </span>
        </div>
      )}
    </div>
  )
}
