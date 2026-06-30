"use client"

export type ProbabilityOutcome = {
  label: string
  odds: number // percentage 0-100
}

export type OathSide = {
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
      type: "oath"
      icon?: string
      betType: string // e.g., "PRICE BET"
      description: string // e.g., "PLS above $0.0001"
      deadline: string // e.g., "by March 15, 2027"
      category: string
      yesData: OathSide
      noData: OathSide
      closesIn: string // e.g., "4 days"
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

  // Oath Market card
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

      {/* CTA for open side */}
      <button className="w-full bg-[#1a1a20] hover:bg-[#2a2a35] text-[#d4af37] font-sans text-xs font-semibold py-2 rounded mb-3 transition-colors border border-[#d4af37]/30 hover:border-[#d4af37]/60">
        Take {props.noData.isTaken ? "YES" : "NO"} – Stake {(props.noData.isTaken ? props.yesData.staked : props.noData.staked).toLocaleString()}, Win{" "}
        {(props.noData.isTaken ? props.yesData.wins : props.noData.wins).toLocaleString()}
      </button>

      {/* Closes in */}
      <p className="font-sans text-xs text-[#7c7a76]">Closes in {props.closesIn}</p>
    </div>
  )
}
