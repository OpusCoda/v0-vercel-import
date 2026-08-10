"use client"

import { useMemo } from "react"
import { useReadContract, useReadContracts } from "wagmi"
import type { Address } from "viem"
import { predictionMarketAbi } from "@/lib/abis/prediction-market"

const PREDICTION_MARKET_ADDRESS =
  (process.env.NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS as Address) ||
  ("0x77b004A0029d725e353E5EE0D80102516A4e52a8" as Address)

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

/**
 * Gathers markets that need resolver/admin attention: those in
 * AwaitingResolution, ChallengeWindow, or with an active/disputed proposal.
 * Reads marketCount, then getMarket/getStatus/getProposal per market.
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

// One getMarket + getStatus + getProposal per market.
  const calls = useMemo(() => {
    const c = []
    for (let i = 0; i < count; i++) {
      c.push({ ...contract, functionName: "getMarket", args: [BigInt(i)] })
      c.push({ ...contract, functionName: "getStatus", args: [BigInt(i)] })
      c.push({ ...contract, functionName: "getProposal", args: [BigInt(i)] })
    }
    return c
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
    // With allowFailure, each entry is { status: 'success'|'failure', result?: unknown, error?: Error }.
    const results = reads as readonly {
      status: "success" | "failure"
      result?: unknown
      error?: Error
    }[]
    const out: ResolutionItem[] = []
    for (let i = 0; i < count; i++) {
      const marketRes = results[i * 3]
      const statusRes = results[i * 3 + 1]
      const proposalRes = results[i * 3 + 2]
      if (marketRes?.status !== "success" || statusRes?.status !== "success") continue

      const m = marketRes.result as {
        question: string
        bettingDeadline: bigint
        resolutionDeadline: bigint
      }
      const statusCode = Number(statusRes.result as number)
      const status = STATUS_LABELS[statusCode] ?? "Betting"

      // Only surface markets that need attention.
      // AwaitingResolution (1), ChallengeWindow (2). Skip Betting/Resolved/Voided.
      if (statusCode !== 1 && statusCode !== 2) continue

      let proposal: ProposalInfo | undefined
      if (proposalRes?.status === "success") {
        const p = proposalRes.result as readonly [
          Address, boolean, bigint, bigint, boolean, bigint, bigint
        ]
        // proposer address(0) means no active proposal.
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