"use client"

import { useState } from "react"
import {
  useReadContract,
  useSimulateContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi"
import type { Address } from "viem"
import { predictionMarketAbi } from "@/lib/abis/prediction-market"

const PREDICTION_MARKET_ADDRESS =
  (process.env.NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS as Address) ||
  ("0xBeE9e50cF2b522D225b2B2115C0c0F2ce2aFE392" as Address)

const ZERO = "0x0000000000000000000000000000000000000000"

// getStatus enum: 0 Betting, 1 AwaitingResolution, 2 ChallengeWindow, 3 Resolved, 4 Voided
// getProposal returns: [proposer, proposedOutcome, proposalTime, expiresAt, disputed, disputerCount, totalBondsAtStake]

/**
 * Permissionless resolution controls shown on a public probability market card.
 * Reads its own status + proposal, so the market list doesn't need to thread
 * anything extra through. Renders:
 *   - AwaitingResolution, no proposal → Propose outcome (bond + Yes/No)
 *   - ChallengeWindow, before expiry  → Dispute (bond)
 *   - ChallengeWindow, after expiry   → Finalize
 *   - Disputed                        → a note (resolver settles it in admin)
 *   - anything else                   → nothing
 */
export function MarketResolutionControls({ marketId }: { marketId: bigint }) {
  const contract = {
    address: PREDICTION_MARKET_ADDRESS,
    abi: predictionMarketAbi,
  } as const

  const { data: statusData } = useReadContract({
    ...contract,
    functionName: "getStatus",
    args: [marketId],
    query: { refetchInterval: 10000 },
  })
  const { data: proposalData } = useReadContract({
    ...contract,
    functionName: "getProposal",
    args: [marketId],
    query: { refetchInterval: 10000 },
  })

  const status = statusData !== undefined ? Number(statusData as bigint | number) : undefined

  // Only render for AwaitingResolution (1) or ChallengeWindow (2).
  if (status !== 1 && status !== 2) return null

  const p = proposalData as
    | readonly [Address, boolean, bigint, bigint, boolean, bigint, bigint]
    | undefined
  const hasProposal = !!p && p[0] !== ZERO
  const disputed = !!p && p[4]

  return (
    <div className="mt-3 border-t border-[#2a2a35] pt-3">
      {status === 1 && !hasProposal && (
        <ProposeControl marketId={marketId} />
      )}
      {status === 2 && p && !disputed && (
        <FinalizeOrDispute marketId={marketId} expiresAt={Number(p[3])} proposedOutcome={p[1]} />
      )}
      {disputed && (
        <p className="font-sans text-[11px] text-[#7c7a76]">
          This proposal is disputed — a resolver will settle it.
        </p>
      )}
    </div>
  )
}

// proposeOutcome(marketId, outcome) — permissionless, posts requiredBond as value.
function ProposeControl({ marketId }: { marketId: bigint }) {
  const [outcome, setOutcome] = useState<boolean | null>(null)

  const { data: bond } = useReadContract({
    address: PREDICTION_MARKET_ADDRESS,
    abi: predictionMarketAbi,
    functionName: "requiredBond",
    args: [marketId],
  })

  const ready = outcome !== null && bond !== undefined
  const { data: sim, error: simError } = useSimulateContract({
    address: PREDICTION_MARKET_ADDRESS,
    abi: predictionMarketAbi,
    functionName: "proposeOutcome",
    args: outcome !== null ? [marketId, outcome] : undefined,
    value: bond as bigint | undefined,
    query: { enabled: ready },
  })
  const { data: hash, writeContract, isPending, error: writeError } = useWriteContract()
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  if (isSuccess) return <p className="font-sans text-xs text-green-400">✓ Outcome proposed.</p>

  const bondLabel =
    bond !== undefined ? (Number(bond) / 1e18).toLocaleString(undefined, { maximumFractionDigits: 0 }) : "…"

  return (
    <div>
      <p className="mb-2 font-sans text-[11px] font-semibold text-[#B87333]">
        Betting has closed — propose the outcome. Posts a {bondLabel} PLS bond, returned if uncontested.
      </p>
      <div className="mb-2 flex items-center gap-2">
        <span className="font-sans text-[10px] text-[#7c7a76]">Outcome:</span>
        <button
          onClick={() => setOutcome(true)}
          className={`rounded px-2 py-0.5 font-sans text-[10px] font-semibold ${outcome === true ? "bg-green-400 text-[#0a0a0c]" : "border border-green-400/30 text-green-400"}`}
        >YES</button>
        <button
          onClick={() => setOutcome(false)}
          className={`rounded px-2 py-0.5 font-sans text-[10px] font-semibold ${outcome === false ? "bg-red-400 text-[#0a0a0c]" : "border border-red-400/30 text-red-400"}`}
        >NO</button>
      </div>
      <button
        onClick={() => sim?.request && writeContract(sim.request)}
        disabled={!ready || !sim?.request || isPending || confirming}
        className="w-full rounded border border-[#B87333]/40 bg-[#B87333]/10 py-1.5 font-sans text-[11px] font-semibold text-[#B87333] hover:bg-[#B87333]/20 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? "Confirm in wallet…" : confirming ? "Proposing…" : "Propose outcome"}
      </button>
      {simError && ready && <p className="mt-1 font-sans text-[10px] text-red-400">{simError.message}</p>}
      {writeError && <p className="mt-1 font-sans text-[10px] text-red-400">Transaction failed — see wallet.</p>}
    </div>
  )
}

// In ChallengeWindow: finalize once expired, or dispute before then.
function FinalizeOrDispute({
  marketId,
  expiresAt,
  proposedOutcome,
}: {
  marketId: bigint
  expiresAt: number
  proposedOutcome: boolean
}) {
  const now = Math.floor(Date.now() / 1000)
  const expired = now >= expiresAt

  const { data: bond } = useReadContract({
    address: PREDICTION_MARKET_ADDRESS,
    abi: predictionMarketAbi,
    functionName: "requiredBond",
    args: [marketId],
  })
  const { data: finSim } = useSimulateContract({
    address: PREDICTION_MARKET_ADDRESS,
    abi: predictionMarketAbi,
    functionName: "finalizeProposal",
    args: [marketId],
    query: { enabled: expired },
  })
  const { data: dispSim } = useSimulateContract({
    address: PREDICTION_MARKET_ADDRESS,
    abi: predictionMarketAbi,
    functionName: "disputeProposal",
    args: [marketId],
    value: bond as bigint | undefined,
    query: { enabled: !expired && bond !== undefined },
  })
  const { data: hash, writeContract, isPending, error } = useWriteContract()
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  if (isSuccess) return <p className="font-sans text-xs text-green-400">✓ Done.</p>

  const bondLabel =
    bond !== undefined ? (Number(bond) / 1e18).toLocaleString(undefined, { maximumFractionDigits: 0 }) : "…"

  return (
    <div className="flex flex-col gap-1">
      <p className="font-sans text-[11px] text-[#b8b6b1]">
        Proposed outcome:{" "}
        <span className={proposedOutcome ? "text-green-400" : "text-red-400"}>
          {proposedOutcome ? "YES" : "NO"}
        </span>
      </p>
      {expired ? (
        <button
          onClick={() => finSim?.request && writeContract(finSim.request)}
          disabled={!finSim?.request || isPending || confirming}
          className="rounded border border-[#B87333]/40 bg-[#B87333]/10 px-3 py-1.5 font-sans text-[11px] font-semibold text-[#B87333] hover:bg-[#B87333]/20 disabled:opacity-50"
        >
          {isPending ? "Confirm…" : confirming ? "Finalizing…" : "Finalize resolution"}
          {error && <span className="ml-1 text-red-400">·failed</span>}
        </button>
      ) : (
        <>
          <p className="font-sans text-[10px] text-[#7c7a76]">
            Only dispute if you believe the proposed outcome is wrong — otherwise no action is needed.
          </p>
          <button
            onClick={() => dispSim?.request && writeContract(dispSim.request)}
            disabled={!dispSim?.request || isPending || confirming}
            className="rounded border border-red-500/40 bg-red-500/10 px-3 py-1.5 font-sans text-[11px] font-semibold text-red-400 hover:bg-red-500/20 disabled:opacity-50"
          >
            {isPending ? "Confirm…" : confirming ? "Disputing…" : `Dispute — post ${bondLabel} PLS`}
          </button>
          <span className="font-sans text-[10px] text-[#7c7a76]">
            If uncontested, this market resolves in {(() => {
              const s = Math.max(0, expiresAt - now)
              const h = Math.floor(s / 3600)
              const m = Math.floor((s % 3600) / 60)
              return h > 0 ? `${h}h ${m}m` : `${m}m`
            })()}.
          </span>
        </>
      )}
    </div>
  )
}