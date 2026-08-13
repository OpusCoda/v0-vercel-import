"use client"
import { useMemo } from "react"
import { useAccount, useReadContracts } from "wagmi"
import type { Address } from "viem"
import { predictionMarketAbi } from "@/lib/abis/prediction-market"
import { useAllMarkets, type MarketWithId } from "@/hooks/useAllMarkets"

const PREDICTION_MARKET_ADDRESS =
  (process.env.NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS as Address) ||
  ("0xBeE9e50cF2b522D225b2B2115C0c0F2ce2aFE392" as Address)

// getUserPosition tuple (must match the NEW cost-basis struct order):
// yesShares, noShares, netCollateral, yesCostBasis, noCostBasis, hasTraded,
// claimed, voidRefundClaimed, estimatedGrossPayout, estimatedFee,
// estimatedNetPayout, canClaimWinnings, canClaimVoidRefund, canClaimAbandoned,
// canClaimResidual, claimableAmount
interface RawUserPosition {
  yesShares: bigint
  noShares: bigint
  netCollateral: bigint
  yesCostBasis: bigint
  noCostBasis: bigint
  hasTraded: boolean
  claimed: boolean
  voidRefundClaimed: boolean
  estimatedGrossPayout: bigint
  estimatedFee: bigint
  estimatedNetPayout: bigint
  canClaimWinnings: boolean
  canClaimVoidRefund: boolean
  canClaimAbandoned: boolean
  canClaimResidual: boolean
  claimableAmount: bigint
}

// One side of a position (YES or NO) that the user actually holds.
export interface MarketPositionSide {
  side: "YES" | "NO"
  shares: bigint // 1e18-scaled AMM shares
  costBasis: bigint // wei PLS spent on this side (from contract)
  // Current mark-to-market value of these shares, in wei PLS.
  // Derived from quoteSell — what the user could exit for right now.
  currentValue: bigint
  // Average entry probability, bps (costBasis per share, expressed vs pool odds).
  avgEntryBps: number
  // Current spot probability for this side, bps.
  currentProbBps: number
  // Unrealized P/L = currentValue - costBasis, wei (can be negative).
  unrealizedPnl: bigint
}

export interface MarketPosition {
  marketId: bigint
  market: MarketWithId["market"]
  sides: MarketPositionSide[]
  // Claim state (from getUserPosition) — surfaced so the page can show
  // Claim buttons on resolved/voided/abandoned markets.
  canClaimWinnings: boolean
  canClaimVoidRefund: boolean
  canClaimAbandoned: boolean
  canClaimResidual: boolean
  claimableAmount: bigint
  estimatedNetPayout: bigint
  claimed: boolean
}

// yesProbBps for a pool: yesPool / (yesPool + noPool), in bps.
function yesProbBps(yesPool: bigint, noPool: bigint): number {
  const total = yesPool + noPool
  if (total === 0n) return 5000
  return Number((yesPool * 10000n) / total)
}

/**
 * All of the connected user's Probability Shop positions.
 *
 * Two read passes:
 *   1. getUserPosition(marketId, user) for every market — shares, cost basis,
 *      claim flags. Cheap, one struct per market.
 *   2. quoteSell(marketId, side, shares) for every side the user actually holds
 *      and that is still tradable (not resolved/voided) — gives live exit value
 *      and thus unrealized P/L. Skipped for resolved/voided markets, where
 *      "value" is the claimable payout, not a sell quote.
 *
 * Requires the cost-basis contract (getUserPosition returns yesCostBasis /
 * noCostBasis). Against the pre-cost-basis contract the tuple is shorter and
 * these fields decode as undefined — deploy the new contract first.
 */
export function useMyMarketPositions() {
  const { address } = useAccount()
  const { markets, isLoading: marketsLoading, error: marketsError, refetch: refetchMarkets } =
    useAllMarkets()

  const contract = {
    address: PREDICTION_MARKET_ADDRESS,
    abi: predictionMarketAbi,
  } as const

  // Pass 1 — getUserPosition for every market.
  const positionCalls = useMemo(
    () =>
      address
        ? markets.map((m) => ({
          ...contract,
          functionName: "getUserPosition" as const,
          args: [m.marketId, address] as const,
        }))
        : [],
    [markets, address]
  )

  const {
    data: positionReads,
    isLoading: positionsLoading,
    error: positionsError,
    refetch: refetchPositions,
  } = useReadContracts({
    contracts: positionCalls,
    allowFailure: true,
    query: { enabled: !!address && markets.length > 0 },
  })

  // Figure out which (market, side) pairs the user actually holds AND are still
  // tradable, so we only quoteSell those.
  const sellQuoteTargets = useMemo(() => {
    if (!positionReads) return [] as { marketId: bigint; side: boolean; shares: bigint }[]
    const targets: { marketId: bigint; side: boolean; shares: bigint }[] = []
    positionReads.forEach((res, i) => {
      if (res.status !== "success" || !res.result) return
      const p = res.result as unknown as RawUserPosition
      const mkt = markets[i]?.market
      const tradable = mkt && !mkt.resolved && !mkt.voided
      if (!tradable) return
      if (p.yesShares > 0n) targets.push({ marketId: markets[i].marketId, side: true, shares: p.yesShares })
      if (p.noShares > 0n) targets.push({ marketId: markets[i].marketId, side: false, shares: p.noShares })
    })
    return targets
  }, [positionReads, markets])

  // Pass 2 — quoteSell for each held, tradable side.
  const sellQuoteCalls = useMemo(
    () =>
      sellQuoteTargets.map((t) => ({
        ...contract,
        functionName: "quoteSell" as const,
        args: [t.marketId, t.side, t.shares] as const,
      })),
    [sellQuoteTargets]
  )

  const {
    data: sellQuoteReads,
    isLoading: quotesLoading,
    error: quotesError,
    refetch: refetchQuotes,
  } = useReadContracts({
    contracts: sellQuoteCalls,
    allowFailure: true,
    query: { enabled: sellQuoteTargets.length > 0 },
  })

  // quoteSell returns (plsOut, pricePerShare, priceImpactBps). Index the plsOut
  // by "marketId:side" so we can look it up when assembling positions.
  const quoteByKey = useMemo(() => {
    const map = new Map<string, bigint>()
    if (!sellQuoteReads) return map
    sellQuoteReads.forEach((res, i) => {
      const t = sellQuoteTargets[i]
      if (!t) return
      if (res.status === "success" && res.result) {
        const out = (res.result as unknown as readonly [bigint, bigint, bigint])[0]
        map.set(`${t.marketId.toString()}:${t.side ? "YES" : "NO"}`, out)
      } else {
        map.set(`${t.marketId.toString()}:${t.side ? "YES" : "NO"}`, 0n)
      }
    })
    return map
  }, [sellQuoteReads, sellQuoteTargets])

  const positions = useMemo<MarketPosition[]>(() => {
    if (!positionReads || !address) return []
    const out: MarketPosition[] = []

    positionReads.forEach((res, i) => {
      if (res.status !== "success" || !res.result) return
      const p = res.result as unknown as RawUserPosition
      const m = markets[i]
      if (!m) return
      if (p.yesShares === 0n && p.noShares === 0n && !p.hasTraded) return

      const mkt = m.market
      const spotYesBps = yesProbBps(mkt.yesPool, mkt.noPool)
      const sides: MarketPositionSide[] = []

      if (p.yesShares > 0n) {
        const currentValue = quoteByKey.get(`${m.marketId.toString()}:YES`) ?? 0n
        // avg entry prob ~ costBasis per share, expressed as bps of 1e18-priced share.
        // pricePerShare would be costBasis*1e18/shares; as a probability that's
        // (costBasis / shares) scaled to bps. Simplest stable proxy: cost per
        // share in bps = costBasis*10000/shares (shares are 1e18-scaled, so this
        // reads as "bps of 1 PLS per share").
        const avgEntryBps = p.yesShares > 0n ? Number((p.yesCostBasis * 10000n) / p.yesShares) : 0
        sides.push({
          side: "YES",
          shares: p.yesShares,
          costBasis: p.yesCostBasis,
          currentValue,
          avgEntryBps,
          currentProbBps: spotYesBps,
          unrealizedPnl: currentValue - p.yesCostBasis,
        })
      }
      if (p.noShares > 0n) {
        const currentValue = quoteByKey.get(`${m.marketId.toString()}:NO`) ?? 0n
        const avgEntryBps = p.noShares > 0n ? Number((p.noCostBasis * 10000n) / p.noShares) : 0
        sides.push({
          side: "NO",
          shares: p.noShares,
          costBasis: p.noCostBasis,
          currentValue,
          avgEntryBps,
          currentProbBps: 10000 - spotYesBps,
          unrealizedPnl: currentValue - p.noCostBasis,
        })
      }

      out.push({
        marketId: m.marketId,
        market: mkt,
        sides,
        canClaimWinnings: p.canClaimWinnings,
        canClaimVoidRefund: p.canClaimVoidRefund,
        canClaimAbandoned: p.canClaimAbandoned,
        canClaimResidual: p.canClaimResidual,
        claimableAmount: p.claimableAmount,
        estimatedNetPayout: p.estimatedNetPayout,
        claimed: p.claimed,
      })
    })

    return out
  }, [positionReads, markets, quoteByKey, address])

  function refetch() {
    refetchMarkets()
    refetchPositions()
    refetchQuotes()
  }

  return {
    positions,
    isLoading: marketsLoading || positionsLoading || quotesLoading,
    error: marketsError ?? positionsError ?? quotesError,
    refetch,
  }
}