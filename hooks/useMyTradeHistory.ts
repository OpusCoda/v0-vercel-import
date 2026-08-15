"use client"
import { useCallback, useEffect, useRef, useState } from "react"
import { useAccount } from "wagmi"
import { parseAbiItem, type Address } from "viem"
import { publicClient } from "@/lib/pulsechain-client"

const PREDICTION_MARKET_ADDRESS =
  (process.env.NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS as Address) ||
  ("0xBeE9e50cF2b522D225b2B2115C0c0F2ce2aFE392" as Address)

// PredictionMarket deploy block — scanning starts here so we don't walk empty
// ranges before the contract existed. Adjust if the exact deploy block differs;
// starting slightly early only costs a few empty blocks.
const DEPLOY_BLOCK = 27280215n

// Per-call block-range cap. Public RPCs limit getLogs range; 10k blocks is a
// conservative value that most PulseChain RPCs accept. If the RPC rejects the
// range, lower this. Larger = fewer calls but risks rejection.
const RANGE = 10_000n

// Event signatures — must match the deployed contract exactly (indexed flags
// matter: marketId + trader/winner are indexed, so we can filter by address).
const SHARES_BOUGHT = parseAbiItem(
  "event SharesBought(uint256 indexed marketId, address indexed trader, bool side, uint256 plsIn, uint256 sharesOut, uint256 newYesPool, uint256 newNoPool)"
)
const SHARES_SOLD = parseAbiItem(
  "event SharesSold(uint256 indexed marketId, address indexed trader, bool side, uint256 sharesIn, uint256 plsOut, uint256 fee, uint256 newYesPool, uint256 newNoPool)"
)
const WINNINGS_CLAIMED = parseAbiItem(
  "event WinningsClaimed(uint256 indexed marketId, address indexed winner, uint256 payout)"
)

export type TradeKind = "buy" | "sell" | "claim"

// One decoded history entry for the connected user.
export interface TradeEvent {
  kind: TradeKind
  marketId: bigint
  side?: boolean          // buy/sell only (true = YES)
  pls: bigint             // plsIn (buy) | plsOut (sell) | payout (claim), wei
  shares?: bigint         // sharesOut (buy) | sharesIn (sell), 1e18-scaled
  blockNumber: bigint
  txHash: string
  logIndex: number        // to order events within the same block deterministically
}

// Fetch all of a user's trade events in [from, to], paginated by RANGE.
async function fetchUserLogs(user: Address): Promise<TradeEvent[]> {
  const latest = await publicClient.getBlockNumber()
  const events: TradeEvent[] = []

  for (let from = DEPLOY_BLOCK; from <= latest; from += RANGE) {
    const to = from + RANGE - 1n > latest ? latest : from + RANGE - 1n

    // Three separate getLogs (one per event), each filtered by the user's
    // indexed address arg. Parallel within the chunk.
    const [bought, sold, claimed] = await Promise.all([
      publicClient.getLogs({
        address: PREDICTION_MARKET_ADDRESS,
        event: SHARES_BOUGHT,
        args: { trader: user },
        fromBlock: from,
        toBlock: to,
      }),
      publicClient.getLogs({
        address: PREDICTION_MARKET_ADDRESS,
        event: SHARES_SOLD,
        args: { trader: user },
        fromBlock: from,
        toBlock: to,
      }),
      publicClient.getLogs({
        address: PREDICTION_MARKET_ADDRESS,
        event: WINNINGS_CLAIMED,
        args: { winner: user },
        fromBlock: from,
        toBlock: to,
      }),
    ])

    for (const log of bought) {
      events.push({
        kind: "buy",
        marketId: log.args.marketId!,
        side: log.args.side,
        pls: log.args.plsIn!,
        shares: log.args.sharesOut!,
        blockNumber: log.blockNumber!,
        txHash: log.transactionHash!,
        logIndex: log.logIndex!,
      })
    }
    for (const log of sold) {
      events.push({
        kind: "sell",
        marketId: log.args.marketId!,
        side: log.args.side,
        pls: log.args.plsOut!,
        shares: log.args.sharesIn!,
        blockNumber: log.blockNumber!,
        txHash: log.transactionHash!,
        logIndex: log.logIndex!,
      })
    }
    for (const log of claimed) {
      events.push({
        kind: "claim",
        marketId: log.args.marketId!,
        pls: log.args.payout!,
        blockNumber: log.blockNumber!,
        txHash: log.transactionHash!,
        logIndex: log.logIndex!,
      })
    }
  }

  // Chronological order: by block, then logIndex within a block.
  events.sort((a, b) =>
    a.blockNumber === b.blockNumber
      ? a.logIndex - b.logIndex
      : a.blockNumber < b.blockNumber ? -1 : 1
  )
  return events
}

/**
 * The connected user's Probability Shop trade history, read from on-chain
 * events. Disabled until `enabled` is true, so nothing is fetched until the
 * History section is expanded — keeps the page load untouched. Fetches once
 * per (address, enabled) and caches in state; call refetch() to force a reload.
 *
 * STAGE 1: raw decoded trade list only. No realized-P&L math yet — verify this
 * finds and decodes your trades correctly before building P&L on top.
 */
export function useMyTradeHistory(enabled: boolean) {
  const { address } = useAccount()
  const [events, setEvents] = useState<TradeEvent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  // Guard so we only auto-fetch once per (address, enabled) turn-on.
  const fetchedFor = useRef<string | null>(null)

  const load = useCallback(async () => {
    if (!address) return
    setIsLoading(true)
    setError(null)
    try {
      const evs = await fetchUserLogs(address)
      setEvents(evs)
    } catch (e) {
      console.error("[history] fetch failed:", e)
      setError(e instanceof Error ? e : new Error(String(e)))
    } finally {
      setIsLoading(false)
    }
  }, [address])

  useEffect(() => {
    if (!enabled || !address) return
    const key = address.toLowerCase()
    if (fetchedFor.current === key) return // already fetched this session for this address
    fetchedFor.current = key
    void load()
  }, [enabled, address, load])

  const refetch = useCallback(() => {
    fetchedFor.current = null
    void load()
  }, [load])

  return { events, isLoading, error, refetch }
}