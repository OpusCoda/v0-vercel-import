"use client"

import { useState, useMemo } from "react"
import { Search, X } from "lucide-react"
import { MarketCard, type MarketCardProps } from "./market-card"

type Category = "Crypto" | "Politics" | "Sports" | "Macro" | "PulseChain" | "Misc"
type OathStatus = "active" | "open"

interface ProbabilityMarket {
  type: "probability"
  icon: string
  title: string
  category: Category
  outcomes: Array<{ label: string; odds: number }>
}

interface OathMarket {
  type: "oath"
  icon: string
  betType: string
  description: string
  deadline: string
  category: Category
  yesData: { label: string; staked: number; wins: number; isTaken: boolean }
  noData: { label: string; staked: number; wins: number; isTaken: boolean }
  closesIn: string
  status: OathStatus
}

// Mock Probability Shop markets (always "Active")
const probabilityMarkets: ProbabilityMarket[] = [
  {
    type: "probability",
    icon: "🏆",
    title: "2026 World Cup Champion",
    category: "Sports",
    outcomes: [
      { label: "France", odds: 29 },
      { label: "Argentina", odds: 20 },
      { label: "Spain", odds: 11 },
    ],
  },
  {
    type: "probability",
    icon: "🏦",
    title: "July Fed funds decision",
    category: "Macro",
    outcomes: [
      { label: "No change", odds: 84 },
      { label: "Increase", odds: 13 },
      { label: "Decrease", odds: 3 },
    ],
  },
  {
    type: "probability",
    icon: "📊",
    title: "June CPI year-over-year",
    category: "Macro",
    outcomes: [
      { label: "Below 3.8%", odds: 50 },
      { label: "Exactly 3.8%", odds: 30 },
      { label: "Above 3.8%", odds: 28 },
    ],
  },
  {
    type: "probability",
    icon: "₿",
    title: "BTC price range on Jul 1 at 1:00 PM?",
    category: "Crypto",
    outcomes: [
      { label: "58435 to 60820", odds: 90 },
      { label: "Below 58435", odds: 31 },
      { label: "Above 60820", odds: 29 },
    ],
  },
]

// Mock Oath Market (P2P) bets with Active/Open status
const oathMarkets: OathMarket[] = [
  {
    type: "oath",
    icon: "💰",
    betType: "PRICE BET",
    description: "PLS above $0.0001",
    deadline: "by March 15, 2027",
    category: "PulseChain",
    yesData: { label: "YES (taken)", staked: 2000, wins: 1000, isTaken: true },
    noData: { label: "NO (open)", staked: 1000, wins: 2000, isTaken: false },
    closesIn: "4 days",
    status: "open",
  },
  {
    type: "oath",
    icon: "⚽",
    betType: "SPORTS BET",
    description: "Man United wins next match",
    deadline: "by July 20, 2026",
    category: "Sports",
    yesData: { label: "YES (open)", staked: 1500, wins: 1650, isTaken: false },
    noData: { label: "NO (taken)", staked: 1650, wins: 1500, isTaken: true },
    closesIn: "12 days",
    status: "active",
  },
  {
    type: "oath",
    icon: "📈",
    betType: "INDEX BET",
    description: "S&P 500 above 6,000",
    deadline: "by Dec 31, 2026",
    category: "Macro",
    yesData: { label: "YES (taken)", staked: 3000, wins: 2500, isTaken: true },
    noData: { label: "NO (open)", staked: 2500, wins: 3000, isTaken: false },
    closesIn: "184 days",
    status: "active",
  },
  {
    type: "oath",
    icon: "🎬",
    betType: "ENTERTAINMENT BET",
    description: "Oscar Best Picture 2027 winner announced",
    deadline: "by March 12, 2027",
    category: "Misc",
    yesData: { label: "YES (open)", staked: 500, wins: 4500, isTaken: false },
    noData: { label: "NO (taken)", staked: 4500, wins: 500, isTaken: true },
    closesIn: "255 days",
    status: "open",
  },
  {
    type: "oath",
    icon: "🏛️",
    betType: "ELECTION BET",
    description: "Trump wins 2028 US election",
    deadline: "by Nov 15, 2028",
    category: "Politics",
    yesData: { label: "YES (taken)", staked: 5000, wins: 5000, isTaken: true },
    noData: { label: "NO (open)", staked: 5000, wins: 5000, isTaken: false },
    closesIn: "528 days",
    status: "active",
  },
]

const CATEGORIES: Category[] = ["Crypto", "Politics", "Sports", "Macro", "PulseChain", "Misc"]

const MIN_PRICE = 1
const MAX_PRICE = 1_000_000_000

// Format large numbers with K, M, B suffixes
function formatPrice(value: number): string {
  if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(1) + "B"
  if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + "M"
  if (value >= 1_000) return (value / 1_000).toFixed(1) + "K"
  return value.toString()
}

// Parse formatted strings back to numbers
function parsePrice(str: string): number {
  const num = parseFloat(str)
  if (str.endsWith("B")) return num * 1_000_000_000
  if (str.endsWith("M")) return num * 1_000_000
  if (str.endsWith("K")) return num * 1_000
  return num
}

export function MarketsList() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<Set<Category>>(new Set())
  const [oathFilter, setOathFilter] = useState<"All" | "Active" | "Open">("All")
  const [priceMin, setPriceMin] = useState(MIN_PRICE)
  const [priceMax, setPriceMax] = useState(MAX_PRICE)

  // Filter Probability Shop markets
  const filteredProbabilityMarkets = useMemo(() => {
    return probabilityMarkets.filter((market) => {
      const matchesSearch = market.title.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategories.size === 0 || selectedCategories.has(market.category)
      return matchesSearch && matchesCategory
    })
  }, [searchQuery, selectedCategories])

  // Filter Oath Market
  const filteredOathMarkets = useMemo(() => {
    return oathMarkets.filter((market) => {
      const matchesSearch =
        market.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        market.betType.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategories.size === 0 || selectedCategories.has(market.category)
      const matchesStatus =
        oathFilter === "All" || (oathFilter === "Active" && market.status === "active") || (oathFilter === "Open" && market.status === "open")
      // Check if the max of (yes staked, no staked) falls within price range
      const maxStaked = Math.max(market.yesData.staked, market.noData.staked)
      const matchesPrice = maxStaked >= priceMin && maxStaked <= priceMax
      return matchesSearch && matchesCategory && matchesStatus && matchesPrice
    })
  }, [searchQuery, selectedCategories, oathFilter, priceMin, priceMax])

  const toggleCategory = (cat: Category) => {
    const newCats = new Set(selectedCategories)
    if (newCats.has(cat)) {
      newCats.delete(cat)
    } else {
      newCats.add(cat)
    }
    setSelectedCategories(newCats)
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20">
      <div className="mb-8 text-center">
        <h2 className="font-serif text-2xl font-bold text-[#e8e6e3] md:text-3xl">Active Markets</h2>
        <p className="mt-2 font-sans text-sm text-[#b8b6b1]">Browse and place bets on real-world outcomes</p>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-8 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7c7a76]" />
          <input
            type="text"
            placeholder="Search markets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-[#2a2a35] bg-[#101017] pl-10 pr-4 py-2 font-sans text-sm text-[#e8e6e3] placeholder-[#7c7a76] focus:border-[#d4af37] focus:outline-none focus:ring-1 focus:ring-[#d4af37]/30"
          />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => toggleCategory(cat)}
              className={`rounded-full px-3 py-1 font-sans text-xs font-semibold transition-colors ${
                selectedCategories.has(cat)
                  ? "bg-[#d4af37] text-[#0a0a0c]"
                  : "border border-[#2a2a35] bg-[#101017] text-[#b8b6b1] hover:border-[#d4af37]/50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Two-column layout: 50/50 split */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left column: Probability Shop */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-semibold text-[#d4af37]">Probability Shop</h3>
            <span className="font-sans text-xs text-[#7c7a76]">{filteredProbabilityMarkets.length} markets</span>
          </div>
          <div className="flex flex-col gap-3 max-h-[800px] overflow-y-auto pr-2">
            {filteredProbabilityMarkets.length > 0 ? (
              filteredProbabilityMarkets.map((market, idx) => (
                <MarketCard
                  key={idx}
                  type="probability"
                  icon={market.icon}
                  title={market.title}
                  outcomes={market.outcomes}
                />
              ))
            ) : (
              <div className="py-8 text-center text-[#7c7a76]">
                <p className="font-sans text-sm">No markets match your search</p>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Oath Market */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-serif text-lg font-semibold text-[#d4af37]">Oath Market</h3>
            <div className="flex gap-1">
              {["All", "Active", "Open"].map((status) => (
                <button
                  key={status}
                  onClick={() => setOathFilter(status as "All" | "Active" | "Open")}
                  className={`rounded px-2 py-1 font-sans text-xs font-semibold transition-colors ${
                    oathFilter === status
                      ? "bg-[#d4af37] text-[#0a0a0c]"
                      : "border border-[#2a2a35] bg-[#101017] text-[#b8b6b1] hover:border-[#d4af37]/50"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="rounded-lg border border-[#2a2a35] bg-[#0a0a0c] p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-sans text-xs font-semibold text-[#b8b6b1]">Stake Range</p>
              <p className="font-sans text-xs text-[#d4af37]">
                {formatPrice(priceMin)} – {formatPrice(priceMax)} PLS
              </p>
            </div>

            {/* Dual-handle range slider */}
            <div className="relative flex items-center gap-2">
              <style>{`
                input[type='range'] {
                  appearance: none;
                  width: 100%;
                  height: 4px;
                  border-radius: 2px;
                  background: #2a2a35;
                  outline: none;
                  -webkit-appearance: none;
                  z-index: ${priceMax > MAX_PRICE * 0.5 ? 5 : 3};
                }
                input[type='range']::-webkit-slider-thumb {
                  appearance: none;
                  -webkit-appearance: none;
                  width: 16px;
                  height: 16px;
                  border-radius: 50%;
                  background: #d4af37;
                  cursor: pointer;
                  box-shadow: 0 0 0 2px #0a0a0c;
                  z-index: ${priceMax > MAX_PRICE * 0.5 ? 5 : 3};
                }
                input[type='range']::-moz-range-thumb {
                  width: 16px;
                  height: 16px;
                  border-radius: 50%;
                  background: #d4af37;
                  cursor: pointer;
                  border: 2px solid #0a0a0c;
                  z-index: ${priceMax > MAX_PRICE * 0.5 ? 5 : 3};
                }
                .slider-container {
                  position: relative;
                  width: 100%;
                }
                .slider-container input {
                  position: absolute;
                  width: 100%;
                }
                .slider-min {
                  z-index: 3;
                }
                .slider-max {
                  z-index: ${priceMax > MAX_PRICE * 0.5 ? 5 : 3};
                }
              `}</style>

              <div className="slider-container">
                <input
                  type="range"
                  min={MIN_PRICE}
                  max={MAX_PRICE}
                  value={priceMin}
                  onChange={(e) => {
                    const newMin = Math.min(Number(e.target.value), priceMax)
                    setPriceMin(newMin)
                  }}
                  className="slider-min"
                />
                <input
                  type="range"
                  min={MIN_PRICE}
                  max={MAX_PRICE}
                  value={priceMax}
                  onChange={(e) => {
                    const newMax = Math.max(Number(e.target.value), priceMin)
                    setPriceMax(newMax)
                  }}
                  className="slider-max"
                />
              </div>
            </div>

            {/* Reset button */}
            {(priceMin !== MIN_PRICE || priceMax !== MAX_PRICE) && (
              <button
                onClick={() => {
                  setPriceMin(MIN_PRICE)
                  setPriceMax(MAX_PRICE)
                }}
                className="mt-4 w-full rounded px-2 py-1 font-sans text-xs font-semibold text-[#d4af37] hover:bg-[#d4af37]/10 transition-colors"
              >
                Reset
              </button>
            )}
          </div>

          <div className="flex flex-col gap-3 max-h-[800px] overflow-y-auto pr-2">
            {filteredOathMarkets.length > 0 ? (
              filteredOathMarkets.map((market, idx) => (
                <MarketCard
                  key={idx}
                  type="oath"
                  icon={market.icon}
                  betType={market.betType}
                  description={market.description}
                  deadline={market.deadline}
                  category={market.category}
                  yesData={market.yesData}
                  noData={market.noData}
                  closesIn={market.closesIn}
                />
              ))
            ) : (
              <div className="py-8 text-center text-[#7c7a76]">
                <p className="font-sans text-sm">No markets match your filters</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
