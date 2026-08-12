'use client'

import { useState } from 'react'
import {
  useAccount,
  useReadContract,
  useSimulateContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi'
import type { Address } from 'viem'
import { predictionMarketAbi } from '@/lib/abis/prediction-market'
import {
  useMarketsNeedingResolution,
  type ResolutionItem,
} from '@/hooks/useMarketsNeedingResolution'

const PREDICTION_MARKET_ADDRESS =
  (process.env.NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS as Address) ||
  ('0x77b004A0029d725e353E5EE0D80102516A4e52a8' as Address)

function short(addr?: string) {
  if (!addr) return ''
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

export function DisputesResolutions() {
  console.log('[DR] mounted')
  const { address } = useAccount()
  const { items, isLoading, refetch } = useMarketsNeedingResolution()

  const contract = {
    address: PREDICTION_MARKET_ADDRESS,
    abi: predictionMarketAbi,
  } as const

  const { data: owner } = useReadContract({ ...contract, functionName: 'owner' })
  const { data: resolver } = useReadContract({ ...contract, functionName: 'resolver' })

  const isAdmin =
    Boolean(address) && owner?.toLowerCase() === address?.toLowerCase()
  // (extend with isAdmin(address) read later if you add non-owner admins)
  const isResolver =
    Boolean(address) && resolver?.toLowerCase() === address?.toLowerCase()

  if (isLoading) {
    return (
      <div className="rounded-lg border border-[#2a2a35] bg-[#101017] p-8 text-center">
        <p className="font-sans text-sm text-[#7c7a76]">Loading markets…</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-[#2a2a35] bg-[#101017] p-8 text-center">
        <p className="font-sans text-sm text-[#7c7a76]">Nothing awaiting resolution right now.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <ResolutionCard
          key={item.marketId.toString()}
          item={item}
          isAdmin={isAdmin}
          isResolver={isResolver}
          onDone={refetch}
        />
      ))}
    </div>
  )
}

function ResolutionCard({
  item,
  isAdmin,
  isResolver,
  onDone,
}: {
  item: ResolutionItem
  isAdmin: boolean
  isResolver: boolean
  onDone: () => void
}) {
  const p = item.proposal
  const disputed = Boolean(p?.disputed)

  return (
    <div className="rounded-lg border border-[#2a2a35] bg-[#101017] p-6">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="font-sans text-sm font-semibold text-[#e8e6e3]">{item.question}</p>
          <p className="mt-1 font-sans text-xs text-[#7c7a76]">Market #{item.marketId.toString()}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 font-sans text-[10px] font-semibold ${disputed
              ? 'border border-red-500/30 bg-red-500/10 text-red-400'
              : item.status === 'ChallengeWindow'
                ? 'border border-[#B87333]/30 bg-[#B87333]/10 text-[#B87333]'
                : 'border border-[#7c7a76]/30 bg-[#7c7a76]/10 text-[#b8b6b1]'
            }`}
        >
          {disputed ? 'Disputed' : item.status === 'ChallengeWindow' ? 'Challenge window' : 'Awaiting proposal'}
        </span>
      </div>

      {/* Proposal detail */}
      {p ? (
        <div className="mb-4 space-y-1 rounded-lg border border-[#2a2a35] bg-[#0d0d12] p-3 font-sans text-xs text-[#b8b6b1]">
          <div className="flex justify-between">
            <span className="text-[#7c7a76]">Proposed outcome</span>
            <span className={p.proposedOutcome ? 'text-green-400' : 'text-red-400'}>
              {p.proposedOutcome ? 'YES' : 'NO'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#7c7a76]">Proposer</span>
            <span className="font-mono">{short(p.proposer)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#7c7a76]">Disputes</span>
            <span>{p.disputerCount.toString()}</span>
          </div>
        </div>
      ) : (
        <p className="mb-4 font-sans text-xs text-[#7c7a76]">
          No proposal yet — awaiting someone to propose an outcome (bonded, permissionless).
        </p>
      )}

      {/* Controls */}
      <div className="flex flex-wrap gap-2">
        {/* resolverSettle — only for disputed markets, only the resolver */}
        {disputed && isResolver && (
          <ResolverSettleControls marketId={item.marketId} onDone={onDone} />
        )}
        {disputed && !isResolver && (
          <p className="font-sans text-xs text-[#7c7a76]">
            This market is disputed — only the resolver can settle it.
          </p>
        )}

        {/* Admin controls: void + reset */}
        {isAdmin && (
          <>
            <VoidControl marketId={item.marketId} onDone={onDone} />
            {p && <ResetControl marketId={item.marketId} onDone={onDone} />}
          </>
        )}
      </div>
    </div>
  )
}

// resolverSettle(marketId, outcome, proposerCorrect)
function ResolverSettleControls({
  marketId,
  onDone,
}: {
  marketId: bigint
  onDone: () => void
}) {
  const [outcome, setOutcome] = useState<boolean | null>(null)
  const [proposerCorrect, setProposerCorrect] = useState<boolean | null>(null)

  const ready = outcome !== null && proposerCorrect !== null

  const { data: sim, error: simError } = useSimulateContract({
    address: PREDICTION_MARKET_ADDRESS,
    abi: predictionMarketAbi,
    functionName: 'resolverSettle',
    args: ready ? [marketId, outcome!, proposerCorrect!] : undefined,
    query: { enabled: ready },
  })

  const { data: hash, writeContract, isPending, error: writeError } = useWriteContract()
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  if (isSuccess) {
    onDone()
    return <p className="font-sans text-xs text-green-400">✓ Settled.</p>
  }

  return (
    <div className="w-full rounded-lg border border-red-500/20 bg-red-500/5 p-3">
      <p className="mb-2 font-sans text-xs font-semibold text-red-400">Settle dispute (resolver)</p>

      <div className="mb-2 flex items-center gap-2">
        <span className="font-sans text-[10px] text-[#7c7a76]">Final outcome:</span>
        <button
          onClick={() => setOutcome(true)}
          className={`rounded px-2 py-0.5 font-sans text-[10px] font-semibold ${outcome === true ? 'bg-green-400 text-[#0a0a0c]' : 'border border-green-400/30 text-green-400'}`}
        >YES</button>
        <button
          onClick={() => setOutcome(false)}
          className={`rounded px-2 py-0.5 font-sans text-[10px] font-semibold ${outcome === false ? 'bg-red-400 text-[#0a0a0c]' : 'border border-red-400/30 text-red-400'}`}
        >NO</button>
      </div>

      <div className="mb-3 flex items-center gap-2">
        <span className="font-sans text-[10px] text-[#7c7a76]">Proposer was:</span>
        <button
          onClick={() => setProposerCorrect(true)}
          className={`rounded px-2 py-0.5 font-sans text-[10px] font-semibold ${proposerCorrect === true ? 'bg-[#B87333] text-[#0a0a0c]' : 'border border-[#B87333]/30 text-[#B87333]'}`}
        >Correct</button>
        <button
          onClick={() => setProposerCorrect(false)}
          className={`rounded px-2 py-0.5 font-sans text-[10px] font-semibold ${proposerCorrect === false ? 'bg-[#B87333] text-[#0a0a0c]' : 'border border-[#B87333]/30 text-[#B87333]'}`}
        >Wrong</button>
      </div>

      <button
        onClick={() => sim?.request && writeContract(sim.request)}
        disabled={!ready || !sim?.request || isPending || confirming}
        className="w-full rounded border border-red-500/40 bg-red-500/10 py-1.5 font-sans text-xs font-semibold text-red-400 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? 'Confirm in wallet…' : confirming ? 'Settling…' : 'Settle dispute'}
      </button>

      {(simError && ready) && (
        <p className="mt-1 font-sans text-[10px] text-red-400">{simError.message}</p>
      )}
      {writeError && (
        <p className="mt-1 font-sans text-[10px] text-red-400">Transaction failed — see wallet.</p>
      )}
    </div>
  )
}

// voidMarket(marketId)
function VoidControl({ marketId, onDone }: { marketId: bigint; onDone: () => void }) {
  const [confirm, setConfirm] = useState(false)
  const { data: sim } = useSimulateContract({
    address: PREDICTION_MARKET_ADDRESS,
    abi: predictionMarketAbi,
    functionName: 'voidMarket',
    args: [marketId],
    query: { enabled: confirm },
  })
  const { data: hash, writeContract, isPending, error } = useWriteContract()
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  if (isSuccess) {
    onDone()
    return <p className="font-sans text-xs text-green-400">✓ Voided.</p>
  }

  if (!confirm) {
    return (
      <button
        onClick={() => setConfirm(true)}
        className="rounded border border-[#2a2a35] px-3 py-1.5 font-sans text-xs font-semibold text-[#b8b6b1] hover:border-red-500/50 hover:text-red-400"
      >
        Void market
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => sim?.request && writeContract(sim.request)}
        disabled={!sim?.request || isPending || confirming}
        className="rounded border border-red-500/40 bg-red-500/10 px-3 py-1.5 font-sans text-xs font-semibold text-red-400 hover:bg-red-500/20 disabled:opacity-50"
      >
        {isPending ? 'Confirm…' : confirming ? 'Voiding…' : 'Confirm void'}
      </button>
      <button
        onClick={() => setConfirm(false)}
        className="font-sans text-xs text-[#7c7a76] hover:text-[#b8b6b1]"
      >
        Cancel
      </button>
      {error && <span className="font-sans text-[10px] text-red-400">Failed</span>}
    </div>
  )
}

// resetProposal(marketId)
function ResetControl({ marketId, onDone }: { marketId: bigint; onDone: () => void }) {
  const { data: sim } = useSimulateContract({
    address: PREDICTION_MARKET_ADDRESS,
    abi: predictionMarketAbi,
    functionName: 'resetProposal',
    args: [marketId],
  })
  const { data: hash, writeContract, isPending, error } = useWriteContract()
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  if (isSuccess) {
    onDone()
    return <p className="font-sans text-xs text-green-400">✓ Proposal reset.</p>
  }

  return (
    <button
      onClick={() => sim?.request && writeContract(sim.request)}
      disabled={!sim?.request || isPending || confirming}
      className="rounded border border-[#2a2a35] px-3 py-1.5 font-sans text-xs font-semibold text-[#b8b6b1] hover:border-[#B87333]/50 hover:text-[#B87333] disabled:opacity-50"
    >
      {isPending ? 'Confirm…' : confirming ? 'Resetting…' : 'Reset proposal'}
      {error && <span className="ml-1 text-red-400">·failed</span>}
    </button>
  )
}