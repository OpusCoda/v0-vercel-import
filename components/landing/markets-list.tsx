"use client"
import { useState, useMemo } from "react"
import { Search, X } from "lucide-react"
import { MarketCard, type MarketCardProps } from "./market-card"
import { useAllWagers } from "@/hooks/useAllWagers"
import { wagerToCard, type P2PCardData } from "@/lib/wager-to-card"
type Category = "Crypto" | "Politics" | "Sports" | "Macro" | "PulseChain" | "Misc"
type P2PStatus = "active" | "open"
interface ProbabilityMarket {
  type: "probability"
  icon: string
  title: string
  category: Category
  outcomes: Array<{ label: string; odds: number }>
}
// Mock Probability Shop markets (always "Active") — separate PredictionMarket contract, still mock for now.
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
  const [p2pFilter, setP2PFilter] = useState<"All" | "Active" | "Open" | "Completed">("All")
  const [priceMin, setPriceMin] = useState(MIN_PRICE)
  const [priceMax, setPriceMax] = useState(MAX_PRICE)
  // Live P2P wagers from chain (open wagers only — see note below).
  const { wagers, isLoading: wagersLoading } = useAllWagers()
  const p2pMarkets: P2PCardData[] = useMemo(() => wagers.map(wagerToCard), [wagers])
  // Filter Probability Shop markets
  const filteredProbabilityMarkets = useMemo(() => {
    return probabilityMarkets.filter((market) => {
      const matchesSearch = market.title.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategories.size === 0 || selectedCategories.has(market.category)
      return matchesSearch && matchesCategory
    })
  }, [searchQuery, selectedCategories])
  // Filter P2P Market
  const filteredP2PMarkets = useMemo(() => {
    return p2pMarkets.filter((market) => {
      const matchesSearch =
        market.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        market.betType.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory =
        selectedCategories.size === 0 || selectedCategories.has(market.category as Category)
      const matchesStatus =
        (p2pFilter === "All") ||
        (p2pFilter === "Active" && market.status === "active") ||
        (p2pFilter === "Open" && market.status === "open") ||
        (p2pFilter === "Completed" && market.status === "closed")
      // Check if the max of (yes staked, no staked) falls within price range
      const maxStaked = Math.max(market.yesData.staked, market.noData.staked)
      const matchesPrice = maxStaked >= priceMin && maxStaked <= priceMax
      return matchesSearch && matchesCategory && matchesStatus && matchesPrice
    })
  }, [p2pMarkets, searchQuery, selectedCategories, p2pFilter, priceMin, priceMax])
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
              className={`rounded-full px-3 py-1 font-sans text-xs font-semibold transition-colors ${selectedCategories.has(cat)
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
            <div>
              <h3 className="font-serif text-lg font-semibold text-[#d4af37]">Probability Shop</h3>
              <p className="font-sans text-xs text-[#7c7a76]">Prediction market</p>
            </div>
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
        {/* Right column: P2P Market */}
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-serif text-lg font-semibold text-[#d4af37]">P2P Market</h3>
              <p className="font-sans text-xs text-[#7c7a76]">Peer-to-peer wager escrow</p>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              {["All", "Active", "Open", "Completed"].map((status) => (
                <button
                  key={status}
                  onClick={() => setP2PFilter(status as "All" | "Active" | "Open" | "Completed")}
                  className={`rounded px-2 py-1 font-sans text-xs font-semibold transition-colors ${p2pFilter === status
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
              <p className="font-sans text-xs font-semibold text-[#b8b6b1]">Range</p>
              <p className="font-sans text-xs text-[#d4af37]">
                {formatPrice(priceMin)} – {formatPrice(priceMax)}{priceMax === MAX_PRICE ? "+" : ""} PLS
              </p>
            </div>
            {/* Dual-handle range slider */}
            <div className="relative w-full">
              <style>{`
                .dual-slider {
                  position: relative;
                  width: 100%;
                  height: 4px;
                  margin: 8px 0;
                }
                .dual-slider input[type='range'] {
                  position: absolute;
                  width: 100%;
                  height: 4px;
                  top: 0;
                  appearance: none;
                  -webkit-appearance: none;
                  background: transparent;
                  outline: none;
                  pointer-events: none;
                }
                .dual-slider input[type='range']::-webkit-slider-thumb {
                  appearance: none;
                  -webkit-appearance: none;
                  width: 16px;
                  height: 16px;
                  border-radius: 50%;
                  background: #d4af37;
                  cursor: pointer;
                  pointer-events: auto;
                  box-shadow: 0 0 0 2px #0a0a0c;
                }
                .dual-slider input[type='range']::-moz-range-thumb {
                  width: 16px;
                  height: 16px;
                  border-radius: 50%;
                  background: #d4af37;
                  cursor: pointer;
                  pointer-events: auto;
                  border: 2px solid #0a0a0c;
                }
                .dual-slider input[type='range']::-webkit-slider-runnable-track {
                  background: transparent;
                  border: none;
                }
                .dual-slider input[type='range']::-moz-range-track {
                  background: transparent;
                  border: none;
                }
                .dual-slider .track {
                  position: absolute;
                  top: 0;
                  height: 4px;
                  background: #2a2a35;
                  border-radius: 2px;
                  pointer-events: none;
                  width: 100%;
                }
                .dual-slider .range {
                  position: absolute;
                  top: 0;
                  height: 4px;
                  background: #d4af37;
                  border-radius: 2px;
                  pointer-events: none;
                  z-index: 1;
                }
              `}</style>
              <div className="dual-slider">
                <div className="track" />
                <div
                  className="range"
                  style={{
                    left: `${((priceMin - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * 100}%`,
                    right: `${100 - ((priceMax - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * 100}%`,
                  }}
                />
                <input
                  type="range"
                  min={MIN_PRICE}
                  max={MAX_PRICE}
                  value={priceMin}
                  onChange={(e) => {
                    const newMin = Math.min(Number(e.target.value), priceMax)
                    setPriceMin(newMin)
                  }}
                  style={{ zIndex: priceMin > MAX_PRICE - (MAX_PRICE - MIN_PRICE) * 0.1 ? 5 : 3 }}
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
                  style={{ zIndex: priceMax > MAX_PRICE - (MAX_PRICE - MIN_PRICE) * 0.1 ? 3 : 5 }}
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 max-h-[800px] overflow-y-auto pr-2">
            {wagersLoading ? (
              <div className="py-8 text-center text-[#7c7a76]">
                <p className="font-sans text-sm">Loading wagers...</p>
              </div>
            ) : filteredP2PMarkets.length > 0 ? (
              filteredP2PMarkets.map((market) => (
                <MarketCard
                  key={market.id}
                  type="p2p"
                  id={market.id}
                  icon={market.icon}
                  betType={market.betType}
                  description={market.description}
                  deadline={market.deadline}
                  category={market.category}
                  yesData={market.yesData}
                  noData={market.noData}
                  closesIn={market.closesIn}
                  creator={market.creator}
                  isPriceBet={market.isPriceBet}
                  creatorBetsAbove={market.creatorBetsAbove}
                  targetPrice={market.targetPrice}
                  tokenLabel={market.tokenLabel}
                  status={market.status}
                  eventDateTs={market.eventDateTs}
                  winnerShort={market.winnerShort}
                />
              ))
            ) : (
              <div className="py-8 text-center text-[#7c7a76]">
                <p className="font-sans text-sm">No wagers match your filters</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
