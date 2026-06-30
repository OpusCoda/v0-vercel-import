"use client"

import { TrendingUp } from "lucide-react"

export type MarketOutcome = {
  label: string
  odds: number // percentage 0-100
}

export type MarketCardProps = {
  icon?: string // emoji or icon URL
  title: string
  outcomes: MarketOutcome[]
  volume?: string
  openInterest?: string
  isOathMarket?: boolean // true for Oath Market (P2P), false for Probability Shop
}

export function MarketCard({
  icon = "📊",
  title,
  outcomes,
  volume,
  openInterest,
  isOathMarket = false,
}: MarketCardProps) {
  return (
    <div className="flex flex-col rounded-xl border border-[#2a2a35] bg-[#101017] p-4 transition-colors hover:border-[#d4af37]/30">
      {/* Header with icon and title */}
      <div className="flex items-center gap-3 pb-4">
        <span className="text-2xl">{icon}</span>
        <div className="flex-1">
          <h3 className="font-sans text-sm font-semibold text-[#e8e6e3] line-clamp-2">{title}</h3>
        </div>
      </div>

      {/* Outcomes */}
      <div className="space-y-2 border-t border-[#2a2a35] pt-3">
        {outcomes.map((outcome, idx) => (
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

      {/* Stats footer */}
      {(volume || openInterest) && (
        <div className="mt-3 border-t border-[#2a2a35] pt-2 flex items-center justify-between">
          <div className="flex items-center gap-1 text-[10px] text-[#7c7a76]">
            <TrendingUp className="h-3 w-3" />
            <span>
              {volume && `$${volume} Vol`}
              {volume && openInterest && " · "}
              {openInterest && `$${openInterest} OI`}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
