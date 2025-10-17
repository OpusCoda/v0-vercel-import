"use client"

import { useState } from "react"

interface PortfolioCardProps {
  title: string
  total?: string
  totalLabel?: string
  totalLeft?: { label: string; value: string }
  totalRight?: { label: string; value: string }
  items?: { label: string; value: string; valueColor?: string }[]
  defaultExpanded?: boolean
}

export default function PortfolioCard({
  title,
  total,
  totalLabel = "Total",
  totalLeft,
  totalRight,
  items = [],
  defaultExpanded = false,
}: PortfolioCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  return (
    <div className="bg-[#131316] border border-[#27272a] rounded-2xl overflow-hidden shadow-lg hover:shadow-[0_0_12px_#7028E440] transition-all">
      <button
        className="w-full p-5 flex items-center justify-between text-left hover:bg-[#1a1a1f] transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
          {totalLeft && totalRight ? (
            <div className="flex items-center gap-8">
              <p className="text-sm text-[#a1a1aa]">
                {totalLeft.label}:{" "}
                <span className="font-mono text-base text-white font-semibold">{totalLeft.value}</span>
              </p>
              <p className="text-sm text-[#a1a1aa]">
                {totalRight.label}:{" "}
                <span className="font-mono text-base text-white font-semibold">{totalRight.value}</span>
              </p>
            </div>
          ) : total ? (
            <p className="text-sm text-[#a1a1aa]">
              {totalLabel}: <span className="font-mono text-base text-white font-semibold">{total}</span>
            </p>
          ) : null}
        </div>
        <svg
          className={`w-5 h-5 text-[#a1a1aa] transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && items.length > 0 && (
        <div className="px-5 pb-5 space-y-3 border-t border-[#27272a] pt-4">
          {items.map((item, i) => (
            <div key={i} className="flex justify-between items-center text-sm">
              <span className="text-[#a1a1aa]">{item.label}</span>
              <span className={`font-mono font-semibold ${item.valueColor || "text-white"}`}>{item.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
