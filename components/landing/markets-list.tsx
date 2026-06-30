"use client"

import { useState, useMemo } from "react"
import { Search, X } from "lucide-react"
import { MarketCard, type MarketCardProps } from "./market-card"

type Category = "Crypto" | "Politics" | "Sports" | "Macro" | "PulseChain" | "Misc"
type OathStatus = "Active" | "Open"

interface ExtendedMarketCard extends MarketCardProps {
  category: Category
  status?: OathStatus // Only for Oath Market
}

// Mock Probability Shop markets (always "Active")
const probabilityMarkets: ExtendedMarketCard[] = [
  {
    icon: "🏆",
    title: "2026 World Cup Champion",
    category: "Sports",
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
    category: "Macro",
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
    category: "Macro",
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
    category: "Crypto",
    outcomes: [
      { label: "58435 to 60820", odds: 90 },
      { label: "Below 58435", odds: 31 },
      { label: "Above 60820", odds: 29 },
    ],
    volume: "78",
    openInterest: "3,134",
  },
]

// Mock Oath Market (P2P) bets with Active/Open status
const oathMarkets: ExtendedMarketCard[] = [
  {
    icon: "💰",
    title: "PLS above $0.0001 on Jan 1, 2027",
    category: "PulseChain",
    status: "Active",
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
    category: "Sports",
    status: "Open",
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
    category: "Macro",
    status: "Active",
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
    category: "Misc",
    status: "Open",
    outcomes: [
      { label: "Yes", odds: 8 },
      { label: "No", odds: 92 },
    ],
    volume: "12,300",
    openInterest: "234,500",
    isOathMarket: true,
  },
  {
    icon: "🏛️",
    title: "Trump wins 2028 US election",
    category: "Politics",
    status: "Active",
    outcomes: [
      { label: "Yes", odds: 55 },
      { label: "No", odds: 45 },
    ],
    volume: "500,000",
    openInterest: "8,200,000",
    isOathMarket: true,
  },
]

const CATEGORIES: Category[] = ["Crypto", "Politics", "Sports", "Macro", "PulseChain", "Misc"]

export function MarketsList() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<Set<Category>>(new Set())
  const [oathFilter, setOathFilter] = useState<"All" | "Active" | "Open">("All")

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
      const matchesSearch = market.title.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategories.size === 0 || selectedCategories.has(market.category)
      const matchesStatus =
        oathFilter === "All" || (oathFilter === "Active" && market.status === "Active") || (oathFilter === "Open" && market.status === "Open")
      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [searchQuery, selectedCategories, oathFilter])

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
              filteredProbabilityMarkets.map((market, idx) => <MarketCard key={idx} {...market} />)
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
          <div className="flex flex-col gap-3 max-h-[800px] overflow-y-auto pr-2">
            {filteredOathMarkets.length > 0 ? (
              filteredOathMarkets.map((market, idx) => (
                <div key={idx} className="relative">
                  <MarketCard {...market} isOathMarket />
                  {market.status && (
                    <div className="absolute top-2 right-2 rounded-full bg-[#d4af37]/10 px-2 py-1 font-sans text-[10px] font-semibold text-[#d4af37] border border-[#d4af37]/30">
                      {market.status}
                    </div>
                  )}
                </div>
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
