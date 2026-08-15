import type { TradeEvent } from "@/hooks/useMyTradeHistory"

export interface MarketRealized {
  marketId: bigint
  realized: bigint        // realized P&L, wei (can be negative)
  totalBought: bigint     // total PLS spent on buys, wei
  totalSold: bigint       // total PLS received from sells, wei
  totalClaimed: bigint    // total PLS from winning claims, wei
  sharesBought: bigint    // 1e18-scaled
  sharesSold: bigint      // 1e18-scaled
  openShares: bigint      // shares still held (bought - sold), 1e18-scaled
  remainingCost: bigint   // cost basis still tied up in open shares, wei
  closed: boolean         // true when no shares remain open
}

interface Lot { shares: bigint; cost: bigint }

/**
 * Compute realized P&L per market from a chronological trade-event list.
 * Returns one entry per market the user has traded, plus a grand total.
 */
export function computeRealizedPnl(events: TradeEvent[]): {
  byMarket: MarketRealized[]
  totalRealized: bigint
} {
  // Per (market, side) running lot for cost-basis tracking.
  const lots = new Map<string, Lot>()
  // Per-market aggregates.
  const agg = new Map<bigint, MarketRealized>()

  const lotKey = (marketId: bigint, side: boolean) => `${marketId.toString()}:${side}`

  function getLot(marketId: bigint, side: boolean): Lot {
    const k = lotKey(marketId, side)
    let l = lots.get(k)
    if (!l) { l = { shares: 0n, cost: 0n }; lots.set(k, l) }
    return l
  }

  function getAgg(marketId: bigint): MarketRealized {
    let a = agg.get(marketId)
    if (!a) {
      a = {
        marketId,
        realized: 0n,
        totalBought: 0n,
        totalSold: 0n,
        totalClaimed: 0n,
        sharesBought: 0n,
        sharesSold: 0n,
        openShares: 0n,
        remainingCost: 0n,
        closed: true,
      }
      agg.set(marketId, a)
    }
    return a
  }

  // events are assumed chronological (useMyTradeHistory sorts by block/logIndex).
  for (const e of events) {
    const a = getAgg(e.marketId)

    if (e.kind === "buy") {
      const l = getLot(e.marketId, e.side!)
      l.shares += e.shares ?? 0n
      l.cost += e.pls
      a.totalBought += e.pls
      a.sharesBought += e.shares ?? 0n
    } else if (e.kind === "sell") {
      const l = getLot(e.marketId, e.side!)
      const sharesIn = e.shares ?? 0n
      a.totalSold += e.pls
      a.sharesSold += sharesIn
      if (l.shares > 0n) {
        const soldCost = (l.cost * sharesIn) / l.shares
        a.realized += e.pls - soldCost
        l.shares -= sharesIn
        l.cost -= soldCost
      } else {
        // Sell with no tracked buys in range → treat basis as 0 (proceeds are
        // pure realized). Happens if a buy predates the scan start block.
        a.realized += e.pls
      }
    } else if (e.kind === "claim") {
      // Winning claim: realize payout minus remaining basis on the held
      // winning side. We infer the winning side as whichever still has shares.
      a.totalClaimed += e.pls
      const y = lots.get(lotKey(e.marketId, true))
      const n = lots.get(lotKey(e.marketId, false))
      const lot = (y && y.shares > 0n) ? y : (n && n.shares > 0n) ? n : null
      if (lot) {
        a.realized += e.pls - lot.cost
        lot.shares = 0n
        lot.cost = 0n
      } else {
        a.realized += e.pls
      }
    }
  }

  // Finalize per-market open-share + remaining-cost figures.
  let totalRealized = 0n
  for (const a of agg.values()) {
    const yes = lots.get(lotKey(a.marketId, true))
    const no = lots.get(lotKey(a.marketId, false))
    const openShares = (yes?.shares ?? 0n) + (no?.shares ?? 0n)
    const remainingCost = (yes?.cost ?? 0n) + (no?.cost ?? 0n)
    a.openShares = openShares
    a.remainingCost = remainingCost
    a.closed = openShares === 0n
    totalRealized += a.realized
  }

  // Newest-first by marketId for display (adjust if you prefer chronological).
  const byMarket = Array.from(agg.values()).sort((x, y) =>
    x.marketId < y.marketId ? 1 : x.marketId > y.marketId ? -1 : 0
  )

  return { byMarket, totalRealized }
}