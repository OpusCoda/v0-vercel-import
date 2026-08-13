"use client"

import { useMemo } from "react"
import { useReadContract, useReadContracts } from "wagmi"
import type { Address } from "viem"
import { predictionMarketAbi } from "@/lib/abis/prediction-market"

const PREDICTION_MARKET_ADDRESS =
  (process.env.NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS as Address) ||
  ("0xBeE9e50cF2b522D225b2B2115C0c0F2ce2aFE392" as Address)

// getStatus enum: 0 Betting, 1 AwaitingResolution, 2 ChallengeWindow, 3 Resolved, 4 Voided
export type MarketStatus =
  | "Betting"
  | "AwaitingResolution"
  | "ChallengeWindow"
  | "Resolved"
  | "Voided"

const STATUS_LABELS: MarketStatus[] = [
  "Betting",
  "AwaitingResolution",
  "ChallengeWindow",
  "Resolved",
  "Voided",
]

export interface ProposalInfo {
  proposer: Address
  proposedOutcome: boolean
  proposalTime: bigint
  expiresAt: bigint
  disputed: boolean
  disputerCount: bigint
  totalBondsAtStake: bigint
}

export interface ResolutionItem {
  marketId: bigint
  question: string
  statusCode: number
  status: MarketStatus
  bettingDeadline: bigint
  resolutionDeadline: bigint
  proposal?: ProposalInfo
}

// A single read result under allowFailure.
type ReadResult = {
  status: "success" | "failure"
  result?: unknown
  error?: Error
}

/**
 * Gathers markets in AwaitingResolution or ChallengeWindow.
 * Reads marketCount, then getMarket/getStatus/getProposal per market.
 *
 * The contracts array is typed loosely (any[]) on purpose: wagmi's
 * useReadContracts tries to infer a per-call return type from the ABI, and with
 * three different functions against a large ABI that inference recurses past
 * TypeScript's depth limit ("Type instantiation is excessively deep"). Casting
 * the array sidesteps that without changing runtime behaviour.
 */
export function useMarketsNeedingResolution() {
  const contract = {
    address: PREDICTION_MARKET_ADDRESS,
    abi: predictionMarketAbi,
  } as const

  const { data: countData, isLoading: countLoading } = useReadContract({
    ...contract,
    functionName: "marketCount",
  })

  const count = countData !== undefined ? Number(countData as bigint) : 0
  console.log("[resolution] count", count, "countData", countData)

  // One getMarket + getStatus + getProposal per market.
  // Typed as any[] to stop deep type inference in useReadContracts.
  const calls = useMemo(() => {
    const c: any[] = []
    for (let i = 0; i < count; i++) {
      c.push({ ...contract, functionName: "getMarket", args: [BigInt(i)] })
      c.push({ ...contract, functionName: "getStatus", args: [BigInt(i)] })
      c.push({ ...contract, functionName: "getProposal", args: [BigInt(i)] })
    }
    return c
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count])

  const {
    data: reads,
    isLoading: readsLoading,
    refetch,
  } = useReadContracts({
    contracts: calls,
    allowFailure: true,
    query: { enabled: count > 0 },
  })

  const items = useMemo<ResolutionItem[]>(() => {
    if (!reads) return []
    const results = reads as unknown as ReadResult[]
    console.log("[resolution] reads", results.map((r) => ({ status: r.status, result: r.result })))

    const out: ResolutionItem[] = []
    for (let i = 0; i < count; i++) {
      const marketRes = results[i * 3]
      const statusRes = results[i * 3 + 1]
      const proposalRes = results[i * 3 + 2]

      if (marketRes?.status !== "success" || statusRes?.status !== "success") continue

      // getMarket returns a single tuple; wagmi gives it back as the struct object.
      const m = marketRes.result as {
        question: string
        bettingDeadline: bigint
        resolutionDeadline: bigint
      }

      const statusCode = Number(statusRes.result as bigint | number)
      const status = STATUS_LABELS[statusCode] ?? "Betting"

      // Only surface markets that need attention: AwaitingResolution (1), ChallengeWindow (2).
      if (statusCode !== 1 && statusCode !== 2) continue

      let proposal: ProposalInfo | undefined
      if (proposalRes?.status === "success" && proposalRes.result) {
        const p = proposalRes.result as readonly [
          Address, boolean, bigint, bigint, boolean, bigint, bigint
        ]
        if (p[0] && p[0] !== "0x0000000000000000000000000000000000000000") {
          proposal = {
            proposer: p[0],
            proposedOutcome: p[1],
            proposalTime: p[2],
            expiresAt: p[3],
            disputed: p[4],
            disputerCount: p[5],
            totalBondsAtStake: p[6],
          }
        }
      }

      out.push({
        marketId: BigInt(i),
        question: m.question,
        statusCode,
        status,
        bettingDeadline: m.bettingDeadline,
        resolutionDeadline: m.resolutionDeadline,
        proposal,
      })
    }
    return out
  }, [reads, count])

  return {
    items,
    isLoading: countLoading || readsLoading,
    refetch,
  }
}