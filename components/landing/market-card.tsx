"use client"
import { useAccount } from "wagmi"
import { useAcceptWager } from "@/hooks/useAcceptWager"
export type ProbabilityOutcome = {
  label: string
  odds: number // percentage 0-100
}
export type P2PSide = {
  label: string // "YES (taken)" or "NO (open)"
  staked: number // e.g., 2000
  wins: number // e.g., 1000
  isTaken: boolean // true for taken side, false for open
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
    id: string           // on-chain wager id, as string
    icon?: string
    betType: string      // e.g., "PRICE BET"
    description: string
    deadline: string
    category: string
    yesData: P2PSide
    noData: P2PSide
    closesIn: string
    creator?: string     // creator address, to disable self-accept
  }
function AcceptButton({
  id,
  takeLabel,
  stakeAmount,
  creator,
}: {
  id: string
  takeLabel: string
  stakeAmount: number
  creator?: string
}) {
  const { address, isConnected } = useAccount()
  const wagerId = (() => {
    try { return BigInt(id) } catch { return undefined }
  })()
  const {
    accept,
    totalRequired,
    requiredLoading,
    isPending,
    isConfirming,
    isSuccess,
    writeError,
  } = useAcceptWager(wagerId)
  const isCreator =
    !!address && !!creator && address.toLowerCase() === creator.toLowerCase()
  const disabled =
    !isConnected || isCreator || requiredLoading || isPending || isConfirming || isSuccess
  let label: string
  if (!isConnected) label = "Connect wallet to accept"
  else if (isCreator) label = "You created this wager"
  else if (isSuccess) label = "Accepted ✓"
  else if (isPending) label = "Confirm in wallet..."
  else if (isConfirming) label = "Accepting..."
  else if (requiredLoading) label = "Loading..."
  else label = `${takeLabel} — Stake ${stakeAmount.toLocaleString()}`
  return (
    <div className="mb-3">
      <button
        onClick={() => accept()}
        disabled={disabled}
        className="w-full bg-[#1a1a20] hover:bg-[#2a2a35] text-[#d4af37] font-sans text-xs font-semibold py-2 rounded transition-colors border border-[#d4af37]/30 hover:border-[#d4af37]/60 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {label}
      </button>
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
        {/* Header */}
        <div className="flex items-center gap-3 pb-4">
          <span className="text-2xl">{props.icon || "📊"}</span>
          <h3 className="font-sans text-sm font-semibold text-[#e8e6e3] line-clamp-2">{props.title}</h3>
        </div>
        {/* Outcomes */}
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
  // P2P Market card
  // The open (takeable) side is whichever isn't taken.
  const openSide = props.noData.isTaken ? props.yesData : props.noData
  const takeLabel = props.noData.isTaken ? "Take YES" : "Take NO"
  return (
    <div className="flex flex-col rounded-xl border border-[#2a2a35] bg-[#101017] p-4 transition-colors hover:border-[#d4af37]/30">
      {/* Header: icon, bet type, category */}
      <div className="flex items-start justify-between pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{props.icon || "🎯"}</span>
          <div>
            <h3 className="font-sans text-xs font-bold text-[#d4af37]">{props.betType}</h3>
          </div>
        </div>
        <span className="font-sans text-xs text-[#d4af37] bg-[#1a1a20] px-2 py-1 rounded">{props.category}</span>
      </div>
      {/* Bet description and deadline */}
      <div className="pb-3 space-y-1">
        <p className="font-sans text-sm font-semibold text-[#e8e6e3]">{props.description}</p>
        <p className="font-sans text-xs text-[#b8b6b1]">{props.deadline}</p>
      </div>
      <div className="border-t border-[#2a2a35] my-3" />
      {/* Yes/No sides */}
      <div className="grid grid-cols-2 gap-4 pb-3">
        {/* YES */}
        <div className="flex flex-col">
          <span className="font-sans text-xs font-bold text-[#e8e6e3] mb-1">
            {props.yesData.label}
          </span>
          <span className="font-sans text-xs text-[#b8b6b1]">Staked: {props.yesData.staked.toLocaleString()} PLS</span>
          <span className="font-sans text-xs text-[#9ca3af]">Wins: {props.yesData.wins.toLocaleString()} PLS</span>
        </div>
        {/* NO */}
        <div className="flex flex-col">
          <span className="font-sans text-xs font-bold text-[#e8e6e3] mb-1">
            {props.noData.label}
          </span>
          <span className="font-sans text-xs text-[#b8b6b1]">Stake: {props.noData.staked.toLocaleString()} PLS</span>
          <span className="font-sans text-xs text-[#9ca3af]">Wins: {props.noData.wins.toLocaleString()} PLS</span>
        </div>
      </div>
      <div className="border-t border-[#2a2a35] my-3" />
      {/* Live accept button */}
      <AcceptButton
        id={props.id}
        takeLabel={takeLabel}
        stakeAmount={openSide.staked}
        creator={props.creator}
      />
      {/* Closes in */}
      <p className="font-sans text-xs text-[#7c7a76]">Time left to accept: {props.closesIn}</p>
    </div>
  )
}
