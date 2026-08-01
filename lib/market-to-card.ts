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

// User-facing status shown as a badge on the card.
export type MarketStatusLabel = "Open" | "Awaiting" | "Resolved"

/**
 * Map an on-chain binary YES/NO market to the probability MarketCard props.
 * Odds come from the AMM pool ratio: YES probability = yesPool / (yes+no).
 * Volume and liquidity are shown in whole PLS.
 */
export function marketToCard(entry: MarketWithId): MarketCardProps {
  const m = entry.market

  const yes = Number(formatUnits(m.yesPool, 18))
  const no = Number(formatUnits(m.noPool, 18))
  const total = yes + no

  // Spot probability from pools. Guard against an empty pool (shouldn't happen
  // since markets are seeded, but be safe).
  const yesOdds = total > 0 ? Math.round((yes / total) * 100) : 50
  const noOdds = 100 - yesOdds

  const categoryLabel = CATEGORY_LABELS[m.category] ?? "Misc"

  // Derive the status label.
  const now = BigInt(Math.floor(Date.now() / 1000))
  let status: MarketStatusLabel
  if (m.resolved) status = "Resolved"
  else if (now < m.bettingDeadline) status = "Open"
  else status = "Awaiting"

  // Volume + liquidity in whole PLS.
  const volumePls = Number(formatUnits(m.totalVolume, 18))
  const liquidityPls = yes + no

  return {
    type: "probability",
    id: entry.marketId.toString(),
    icon: CATEGORY_ICONS[categoryLabel] ?? "📊",
    title: m.question,
    status,
    yesOdds,
    noOdds,
    volumePls,
    liquidityPls,
    bettingDeadline: Number(m.bettingDeadline),
    resolutionDeadline: Number(m.resolutionDeadline),
  }
}