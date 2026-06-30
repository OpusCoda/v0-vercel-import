"use client"

import { MarketCard, type MarketCardProps } from "./market-card"

// Mock Probability Shop markets
const probabilityMarkets: MarketCardProps[] = [
  {
    icon: "🏆",
    title: "2026 World Cup Champion",
    outcomes: [
      { label: "France", odds: 29 },
      { label: "Argentina", odds: 20 },
      { label: "Spain", odds: 11 },
    ],
    volume: "247,238",
    openInterest: "3,802,720",
  },
  {
    icon: "🏦",
    title: "July Fed funds decision",
    outcomes: [
      { label: "No change", odds: 84 },
      { label: "Increase", odds: 13 },
      { label: "Decrease", odds: 3 },
    ],
    volume: "4,174",
    openInterest: "11,462",
  },
  {
    icon: "📊",
    title: "June CPI year-over-year",
    outcomes: [
      { label: "Below 3.8%", odds: 50 },
      { label: "Exactly 3.8%", odds: 30 },
      { label: "Above 3.8%", odds: 28 },
    ],
    volume: "28",
    openInterest: "3,197",
  },
  {
    icon: "₿",
    title: "BTC price range on Jul 1 at 1:00 PM?",
    outcomes: [
      { label: "58435 to 60820", odds: 90 },
      { label: "Below 58435", odds: 31 },
      { label: "Above 60820", odds: 29 },
    ],
    volume: "78",
    openInterest: "3,134",
  },
]

// Mock Oath Market (P2P) bets
const oathMarkets: MarketCardProps[] = [
  {
    icon: "💰",
    title: "PLS above $0.0001 on Jan 1, 2027",
    outcomes: [
      { label: "Yes", odds: 65 },
      { label: "No", odds: 35 },
    ],
    volume: "125,500",
    openInterest: "2,340,000",
    isOathMarket: true,
  },
  {
    icon: "⚽",
    title: "Man United wins next match",
    outcomes: [
      { label: "Yes", odds: 45 },
      { label: "No", odds: 55 },
    ],
    volume: "89,200",
    openInterest: "1,567,800",
    isOathMarket: true,
  },
  {
    icon: "📈",
    title: "S&P 500 closes above 5500",
    outcomes: [
      { label: "Yes", odds: 72 },
      { label: "No", odds: 28 },
    ],
    volume: "156,400",
    openInterest: "3,821,900",
    isOathMarket: true,
  },
  {
    icon: "🎬",
    title: "Oscar Best Picture 2027 - Opus Films",
    outcomes: [
      { label: "Yes", odds: 8 },
      { label: "No", odds: 92 },
    ],
    volume: "12,300",
    openInterest: "234,500",
    isOathMarket: true,
  },
]

export function MarketsList() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20">
      <div className="mb-8 text-center">
        <h2 className="font-serif text-2xl font-bold text-[#e8e6e3] md:text-3xl">Active Markets</h2>
        <p className="mt-2 font-sans text-sm text-[#b8b6b1]">Browse and place bets on real-world outcomes</p>
      </div>

      {/* Two-column layout: 50/50 split */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left column: Probability Shop */}
        <div className="flex flex-col gap-4">
          <h3 className="font-serif text-lg font-semibold text-[#d4af37]">Probability Shop</h3>
          <div className="flex flex-col gap-3 max-h-[800px] overflow-y-auto pr-2">
            {probabilityMarkets.map((market, idx) => (
              <MarketCard key={idx} {...market} />
            ))}
          </div>
        </div>

        {/* Right column: Oath Market */}
        <div className="flex flex-col gap-4">
          <h3 className="font-serif text-lg font-semibold text-[#d4af37]">Oath Market</h3>
          <div className="flex flex-col gap-3 max-h-[800px] overflow-y-auto pr-2">
            {oathMarkets.map((market, idx) => (
              <MarketCard key={idx} {...market} isOathMarket />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
