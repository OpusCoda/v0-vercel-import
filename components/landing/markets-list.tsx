"use client"
import { useState, useMemo } from "react"
import { Search } from "lucide-react"
import { MarketCard } from "./market-card"
import { QuestionMarkIcon } from "@/components/question-mark-icon"
import { useAllWagers } from "@/hooks/useAllWagers"
import { useAllMarkets } from "@/hooks/useAllMarkets"
import { wagerToCard, type P2PCardData } from "@/lib/wager-to-card"
import { marketToCard } from "@/lib/market-to-card"

type Category = "Crypto" | "Politics" | "Sports" | "Macro" | "PulseChain" | "Misc"
type MarketsVariant = "all" | "p2p" | "probability"
type ProbabilityStatus = "All" | "Open" | "Awaiting" | "Resolved"

const CATEGORIES: Category[] = ["Crypto", "Politics", "Sports", "Macro", "PulseChain", "Misc"]
const PROBABILITY_FILTERS: ProbabilityStatus[] = ["All", "Open", "Awaiting", "Resolved"]
const MIN_PRICE = 100_000
const MAX_PRICE = 1_000_000_000

// Format large numbers with K, M, B suffixes
function formatPrice(value: number): string {
  if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(0) + "B"
  if (value >= 1_000_000) return (value / 1_000_000).toFixed(0) + "M"
  if (value >= 1_000) return (value / 1_000).toFixed(0) + "K"
  return value.toString()
}

// Derive a user-facing status bucket from the market struct fields we already
// have — no extra getStatus() call needed. Voided markets are excluded upstream.
function deriveStatus(
  market: { resolved: boolean; voided: boolean; bettingDeadline: bigint },
  now: bigint
): Exclude<ProbabilityStatus, "All"> | "Voided" {
  if (market.voided) return "Voided"
  if (market.resolved) return "Resolved"
  if (now < market.bettingDeadline) return "Open"
  return "Awaiting"
}

export function MarketsList({ variant = "all" }: { variant?: MarketsVariant }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<Set<Category>>(new Set())
  const [p2pFilter, setP2PFilter] = useState<"All" | "Active" | "Open" | "Completed">("All")
  const [probabilityFilter, setProbabilityFilter] = useState<ProbabilityStatus>("All")
  const [priceMin, setPriceMin] = useState(MIN_PRICE)
  const [priceMax, setPriceMax] = useState(MAX_PRICE)

  const showProbability = variant !== "p2p"
  const showP2P = variant !== "probability"

  // Live P2P wagers from chain (open wagers only — see note below).
  const { wagers, isLoading: wagersLoading } = useAllWagers()
  const p2pMarkets: P2PCardData[] = useMemo(() => wagers.map(wagerToCard), [wagers])

  // Live Probability Shop markets from chain.
  const { markets, isLoading: marketsLoading } = useAllMarkets()

  // Filter the RAW markets first (while voided/resolved/bettingDeadline are
  // still available), THEN map to cards. Mapping first would strip those fields.
  const filteredProbabilityCards = useMemo(() => {
    const now = BigInt(Math.floor(Date.now() / 1000))
    return markets
      .filter((e) => {
        const status = deriveStatus(e.market, now)
        // Voided markets are never shown.
        if (status === "Voided") return false
        // Status filter.
        const matchesStatus =
          probabilityFilter === "All" || status === probabilityFilter
        // Search filter on the question text.
        const matchesSearch =
          !searchQuery ||
          e.market.question.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesStatus && matchesSearch
      })
      .map(marketToCard)
  }, [markets, searchQuery, probabilityFilter])

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
    <section className="mx-auto max-w-7xl px-4 pt-4 pb-16 md:px-6 md:pt-6 md:pb-20">
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
      {/* Layout: two columns for "all", single full-width column otherwise */}
      <div className={variant === "all" ? "grid gap-6 lg:grid-cols-2" : "grid gap-6"}>
        {/* Left column: Probability Shop */}
        {showProbability && (
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-serif text-lg font-semibold text-[#d4af37]">Probability Shop</h3>
                <a
                  href="#probability-shop-explainer"
                  onClick={(e) => {
                    e.preventDefault()
                    document.getElementById("probability-shop-explainer")?.scrollIntoView({ behavior: "smooth" })
                  }}
                  className="group relative flex"
                  aria-label="Learn about the Probability Shop"
                >
                  <QuestionMarkIcon className="h-3.5 w-3.5 text-[#7c7a76] hover:text-[#d4af37] transition-colors" />
                  <span className="absolute bottom-full left-1/2 mb-2 hidden w-44 -translate-x-1/2 rounded-lg bg-[#2a2a35]/95 p-2 text-center text-xs text-[#e8e6e3] group-hover:block">
                    Click to learn what this is
                  </span>
                </a>
              </div>
              <p className="font-sans text-xs text-[#7c7a76]">Prediction market</p>
            </div>
            <div className="flex gap-1 shrink-0">
              {PROBABILITY_FILTERS.map((status) => (
                <button
                  key={status}
                  onClick={() => setProbabilityFilter(status)}
                  className={`rounded px-2 py-1 font-sans text-xs font-semibold transition-colors ${probabilityFilter === status
                    ? "bg-[#d4af37] text-[#0a0a0c]"
                    : "border border-[#2a2a35] bg-[#101017] text-[#b8b6b1] hover:border-[#d4af37]/50"
                    }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
          <div className={`flex flex-col gap-3 max-h-200 overflow-y-auto pr-2 ${variant === "probability" ? "lg:grid lg:grid-cols-2 lg:gap-3" : ""}`}>
            {marketsLoading ? (
              <div className="py-8 text-center text-[#7c7a76]">
                <p className="font-sans text-sm">Loading markets…</p>
              </div>
            ) : filteredProbabilityCards.length > 0 ? (
              filteredProbabilityCards.map((card, idx) => (
                <MarketCard key={idx} {...card} />
              ))
            ) : (
              <div className="py-8 text-center text-[#7c7a76]">
                <p className="font-sans text-sm">No markets match your filters</p>
              </div>
            )}
          </div>
        </div>
        )}
        {/* Right column: P2P Market */}
        {showP2P && (
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-serif text-lg font-semibold text-[#d4af37]">Outcome Exchange</h3>
                <a
                  href="#outcome-exchange-explainer"
                  onClick={(e) => {
                    e.preventDefault()
                    document.getElementById("outcome-exchange-explainer")?.scrollIntoView({ behavior: "smooth" })
                  }}
                  className="group relative flex"
                  aria-label="Learn about the Outcome Exchange"
                >
                  <QuestionMarkIcon className="h-3.5 w-3.5 text-[#7c7a76] hover:text-[#d4af37] transition-colors" />
                  <span className="absolute bottom-full left-1/2 mb-2 hidden w-44 -translate-x-1/2 rounded-lg bg-[#2a2a35]/95 p-2 text-center text-xs text-[#e8e6e3] group-hover:block">
                    Click to learn what this is
                  </span>
                </a>
              </div>
              <p className="font-sans text-xs text-[#7c7a76]">Peer-to-peer wager escrow</p>
            </div>
            <div className="flex gap-1 shrink-0">
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
          <div className={`flex flex-col gap-3 max-h-200 overflow-y-auto pr-2 ${variant === "p2p" ? "lg:grid lg:grid-cols-2 lg:gap-3" : ""}`}>
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
        )}
      </div>
    </section>
  )
}