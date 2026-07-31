import { formatUnits } from "viem"
import type { MarketWithId } from "@/hooks/useAllMarkets"
import type { MarketCardProps } from "@/components/landing/market-card"

// PredictionMarket Category enum → label.
const CATEGORY_LABELS = [
  "Crypto",
  "PulseChain",
  "Politics",
  "Sports",
  "Macro",
  "Misc",
] as const

// Pick an icon by category (mirrors the mock markets' style).
const CATEGORY_ICONS: Record<string, string> = {
  Crypto: "₿",
  PulseChain: "🔷",
  Politics: "🏛️",
  Sports: "🏆",
  Macro: "📊",
  Misc: "❓",
}

/**
 * Map an on-chain YES/NO market to the probability MarketCard props.
 * Odds come from the AMM pool ratio: YES probability = yesPool / (yes+no).
 */
export function marketToCard(entry: MarketWithId): MarketCardProps {
  const m = entry.market

  const yes = Number(formatUnits(m.yesPool, 18))
  const no = Number(formatUnits(m.noPool, 18))
  const total = yes + no

  // Spot probability from pools. Guard against an empty pool (shouldn't happen
  // since markets are seeded, but be safe).
  const yesPct = total > 0 ? Math.round((yes / total) * 100) : 50
  const noPct = 100 - yesPct

  const categoryLabel =
    CATEGORY_LABELS[m.category] ?? "Misc"

  return {
    type: "probability",
    icon: CATEGORY_ICONS[categoryLabel] ?? "📊",
    title: m.question,
    outcomes: [
      { label: "Yes", odds: yesPct },
      { label: "No", odds: noPct },
    ],
  }
}