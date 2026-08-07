'use client'

import { useMemo, useState } from 'react'
import {
  useAccount,
  useReadContract,
  useSimulateContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi'
import type { Address } from 'viem'
import { outcomeExchangeAbi } from '@/lib/abis/outcome-exchange'

const OUTCOME_EXCHANGE_ADDRESS = '0x4B5da4B6b4607B5bA054511ef6bD83742287e18F' as Address

// WagerMarket status enum:
// 0 Created, 1 Active, 2 Voting, 3 Resolved, 4 Arbitration, 5 Cancelled, 6 Voided
const STATUS_VOTING = 2
const STATUS_ARBITRATION = 4

const ZERO = '0x0000000000000000000000000000000000000000'

function short(addr?: string) {
  if (!addr) return ''
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

function pls(v?: bigint): string {
  if (v === undefined) return '—'
  return (Number(v) / 1e18).toLocaleString(undefined, { maximumFractionDigits: 0 })
}

// Absolute UTC label for a unix seconds timestamp.
function utc(ts?: bigint | number): string {
  if (ts === undefined) return '—'
  const n = typeof ts === 'bigint' ? Number(ts) : ts
  if (!n) return '—'
  return (
    new Date(n * 1000).toLocaleString('en-GB', {
      timeZone: 'UTC',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }) + ' UTC'
  )
}

// Time remaining until a unix timestamp, or null if already past.
function timeLeft(ts?: bigint): string | null {
  if (ts === undefined) return null
  const secs = Number(ts) - Math.floor(Date.now() / 1000)
  if (secs <= 0) return null
  const days = Math.floor(secs / 86400)
  const hours = Math.floor((secs % 86400) / 3600)
  if (days >= 1) return `${days}d ${hours}h`
  if (hours >= 1) return `${hours}h`
  return `${Math.max(1, Math.floor(secs / 60))}m`
}

export function WagerArbitration() {
  const { address } = useAccount()

  const contract = {
    address: OUTCOME_EXCHANGE_ADDRESS,
    abi: outcomeExchangeAbi,
  } as const

  const { data: totalCount, isLoading: countLoading } = useReadContract({
    ...contract,
    functionName: 'totalWagerCount',
  })

  // Is the connected wallet a seated arbitrator?
  const { data: isArb } = useReadContract({
    ...contract,
    functionName: 'isArbitrator',
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) },
  })

  const ids = useMemo(() => {
    const n = totalCount !== undefined ? Number(totalCount) : 0
    return Array.from({ length: n }, (_, i) => BigInt(i))
  }, [totalCount])

  if (countLoading) {
    return (
      <div className="rounded-lg border border-[#2a2a35] bg-[#101017] p-8 text-center">
        <p className="font-sans text-sm text-[#7c7a76]">Loading wagers…</p>
      </div>
    )
  }

  if (ids.length === 0) {
    return (
      <div className="rounded-lg border border-[#2a2a35] bg-[#101017] p-8 text-center">
        <p className="font-sans text-sm text-[#7c7a76]">No wagers yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Each row self-hides unless the wager is in Voting or Arbitration. */}
      {ids.map((id) => (
        <WagerRow
          key={id.toString()}
          wagerId={id}
          isArbitrator={Boolean(isArb)}
          connected={address}
        />
      ))}
      <p className="pt-2 font-sans text-[10px] text-[#7c7a76]">
        Showing wagers in Voting or Arbitration. Resolved, open, cancelled and voided wagers are hidden.
      </p>
    </div>
  )
}

function WagerRow({
  wagerId,
  isArbitrator,
  connected,
}: {
  wagerId: bigint
  isArbitrator: boolean
  connected?: Address
}) {
  const contract = {
    address: OUTCOME_EXCHANGE_ADDRESS,
    abi: outcomeExchangeAbi,
  } as const

  const { data, refetch } = useReadContract({
    ...contract,
    functionName: 'getWagerDetails',
    args: [wagerId],
    query: { refetchInterval: 15000 },
  })

  const wager = data?.[0]
  const priceBet = data?.[1]
  const arbitrationStart = data?.[4]

  const status = wager?.status
  const isArbitration = status === STATUS_ARBITRATION
  const isVoting = status === STATUS_VOTING

  // Arbitration tally — only fetched for wagers actually in arbitration.
  const { data: arbData, refetch: refetchArb } = useReadContract({
    ...contract,
    functionName: 'getArbitrationStatus',
    args: [wagerId],
    query: { enabled: isArbitration, refetchInterval: 15000 },
  })

  // Human label for the price feed, when this is a price bet.
  const isPriceBet = priceBet !== undefined && priceBet.queryId !== `0x${'0'.repeat(64)}`
  const { data: feedLabel } = useReadContract({
    ...contract,
    functionName: 'queryIdLabel',
    args: priceBet ? [priceBet.queryId] : undefined,
    query: { enabled: isPriceBet },
  })

  // Self-hide anything not needing attention.
  if (!wager || (!isArbitration && !isVoting)) return null

  const arbitrators = (arbData?.[0] ?? []) as readonly Address[]
  const votes = (arbData?.[1] ?? []) as readonly Address[]
  const creatorVotes = arbData?.[2]
  const challengerVotes = arbData?.[3]
  const expiresAt = arbData?.[5]

  const expired = expiresAt !== undefined && Number(expiresAt) <= Math.floor(Date.now() / 1000)
  const remaining = timeLeft(expiresAt)

  // Has the connected wallet already voted in this arbitration?
  const alreadyVoted =
    connected !== undefined &&
    arbitrators.some(
      (a, i) =>
        a.toLowerCase() === connected.toLowerCase() && votes[i] && votes[i] !== ZERO,
    )

  const onPanel =
    connected !== undefined &&
    arbitrators.some((a) => a.toLowerCase() === connected.toLowerCase())

  const refreshAll = () => {
    refetch()
    refetchArb()
  }

  return (
    <div className="rounded-lg border border-[#2a2a35] bg-[#101017] p-6">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="font-sans text-sm font-semibold text-[#e8e6e3]">{wager.description}</p>
          <p className="mt-1 font-sans text-xs text-[#7c7a76]">
            Wager #{wagerId.toString()}
            {isPriceBet && feedLabel ? ` · price bet (${feedLabel})` : ' · standard wager'}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 font-sans text-[10px] font-semibold ${
            isArbitration
              ? 'border border-red-500/30 bg-red-500/10 text-red-400'
              : 'border border-[#d4af37]/30 bg-[#d4af37]/10 text-[#d4af37]'
          }`}
        >
          {isArbitration ? 'Arbitration' : 'Voting'}
        </span>
      </div>

      {/* Parties + stakes */}
      <div className="mb-4 space-y-1 rounded-lg border border-[#2a2a35] bg-[#0d0d12] p-3 font-sans text-xs text-[#b8b6b1]">
        <div className="flex justify-between">
          <span className="text-[#7c7a76]">Creator</span>
          <span className="font-mono">
            {short(wager.creator)} · {pls(wager.creatorStake)} PLS
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#7c7a76]">Challenger</span>
          <span className="font-mono">
            {short(wager.challenger)} · {pls(wager.challengerStake)} PLS
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#7c7a76]">Event date</span>
          <span>{utc(wager.eventDate)}</span>
        </div>
        {isPriceBet && priceBet && (
          <div className="flex justify-between">
            <span className="text-[#7c7a76]">Target</span>
            <span>
              creator bets {priceBet.creatorBetsAbove ? 'above' : 'below'} $
              {(Number(priceBet.targetPrice) / 1e18).toString()}
            </span>
          </div>
        )}
        {isArbitration && (
          <>
            <div className="flex justify-between">
              <span className="text-[#7c7a76]">Arbitration started</span>
              <span>{utc(arbitrationStart)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#7c7a76]">Auto-void at</span>
              <span className={expired ? 'text-red-400' : ''}>
                {utc(expiresAt)}
                {remaining ? ` (${remaining} left)` : expired ? ' — expired' : ''}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Arbitration tally */}
      {isArbitration && arbData && (
        <div className="mb-4 rounded-lg border border-[#2a2a35] bg-[#0d0d12] p-3">
          <p className="mb-2 font-sans text-[10px] font-semibold text-[#7c7a76]">
            Panel votes (3 of 5 required to resolve)
          </p>
          <div className="mb-2 flex gap-4 font-sans text-xs">
            <span className="text-[#b8b6b1]">
              Creator: <span className="font-semibold text-[#d4af37]">{creatorVotes?.toString() ?? '0'}</span>
            </span>
            <span className="text-[#b8b6b1]">
              Challenger:{' '}
              <span className="font-semibold text-[#d4af37]">{challengerVotes?.toString() ?? '0'}</span>
            </span>
          </div>
          <div className="space-y-0.5">
            {arbitrators.map((a, i) => {
              const v = votes[i]
              const voted = v && v !== ZERO
              let label = 'not voted'
              if (voted) {
                if (v.toLowerCase() === wager.creator.toLowerCase()) label = 'creator'
                else if (v.toLowerCase() === wager.challenger.toLowerCase()) label = 'challenger'
                else label = short(v)
              }
              return (
                <div key={a} className="flex justify-between font-sans text-[10px]">
                  <span className="font-mono text-[#7c7a76]">
                    {short(a)}
                    {connected && a.toLowerCase() === connected.toLowerCase() && ' (you)'}
                  </span>
                  <span className={voted ? 'text-[#b8b6b1]' : 'text-[#4a4a55]'}>{label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap gap-2">
        {isArbitration && isArbitrator && onPanel && !alreadyVoted && (
          <CastVoteControls
            wagerId={wagerId}
            creator={wager.creator}
            challenger={wager.challenger}
            onDone={refreshAll}
          />
        )}

        {isArbitration && onPanel && alreadyVoted && (
          <p className="font-sans text-xs text-[#7c7a76]">You have already voted on this wager.</p>
        )}

        {isArbitration && !onPanel && (
          <p className="font-sans text-xs text-[#7c7a76]">
            You are not on this wager&apos;s arbitration panel — only seated arbitrators can vote.
          </p>
        )}

        {isArbitration && expired && (
          <ExpireControl wagerId={wagerId} onDone={refreshAll} />
        )}

        {isVoting && (
          <p className="font-sans text-xs text-[#7c7a76]">
            Awaiting the two parties&apos; votes. If they disagree or fail to vote, this escalates to
            arbitration.
          </p>
        )}
      </div>
    </div>
  )
}

// castArbitrationVote(wagerId, winner)
function CastVoteControls({
  wagerId,
  creator,
  challenger,
  onDone,
}: {
  wagerId: bigint
  creator: Address
  challenger: Address
  onDone: () => void
}) {
  const [winner, setWinner] = useState<Address | null>(null)

  const { data: sim, error: simError } = useSimulateContract({
    address: OUTCOME_EXCHANGE_ADDRESS,
    abi: outcomeExchangeAbi,
    functionName: 'castArbitrationVote',
    args: winner ? [wagerId, winner] : undefined,
    query: { enabled: Boolean(winner) },
  })

  const { data: hash, writeContract, isPending, error: writeError } = useWriteContract()
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  if (isSuccess) {
    onDone()
    return <p className="font-sans text-xs text-green-400">✓ Vote cast.</p>
  }

  return (
    <div className="w-full rounded-lg border border-red-500/20 bg-red-500/5 p-3">
      <p className="mb-2 font-sans text-xs font-semibold text-red-400">
        Cast arbitration vote
      </p>
      <p className="mb-2 font-sans text-[10px] text-[#7c7a76]">
        Vote for the party you judge to have won. Three matching votes resolve the wager and pay the
        winner automatically. This cannot be undone.
      </p>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setWinner(creator)}
          className={`rounded px-2 py-0.5 font-sans text-[10px] font-semibold ${
            winner === creator
              ? 'bg-[#d4af37] text-[#0a0a0c]'
              : 'border border-[#d4af37]/30 text-[#d4af37]'
          }`}
        >
          Creator {short(creator)}
        </button>
        <button
          onClick={() => setWinner(challenger)}
          className={`rounded px-2 py-0.5 font-sans text-[10px] font-semibold ${
            winner === challenger
              ? 'bg-[#d4af37] text-[#0a0a0c]'
              : 'border border-[#d4af37]/30 text-[#d4af37]'
          }`}
        >
          Challenger {short(challenger)}
        </button>
      </div>
      <button
        onClick={() => sim?.request && writeContract(sim.request)}
        disabled={!winner || !sim?.request || isPending || confirming}
        className="w-full rounded border border-red-500/40 bg-red-500/10 py-1.5 font-sans text-xs font-semibold text-red-400 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? 'Confirm in wallet…' : confirming ? 'Voting…' : 'Submit vote'}
      </button>
      {simError && winner && (
        <p className="mt-1 font-sans text-[10px] text-red-400">
          {(() => {
            const msg = simError.message
            if (msg.includes('Not an arbitrator')) return 'Your wallet is not a seated arbitrator.'
            if (msg.includes('Already voted')) return 'You have already voted on this wager.'
            if (msg.includes('Not in arbitration')) return 'This wager is no longer in arbitration.'
            if (msg.includes('Invalid winner')) return 'The selected winner is not a party to this wager.'
            return 'Cannot vote — see wallet for details.'
          })()}
        </p>
      )}
      {writeError && (
        <p className="mt-1 font-sans text-[10px] text-red-400">Transaction failed — see wallet.</p>
      )}
    </div>
  )
}

// expireArbitration(wagerId) — permissionless auto-void once past expiresAt.
function ExpireControl({ wagerId, onDone }: { wagerId: bigint; onDone: () => void }) {
  const [confirm, setConfirm] = useState(false)

  const { data: sim } = useSimulateContract({
    address: OUTCOME_EXCHANGE_ADDRESS,
    abi: outcomeExchangeAbi,
    functionName: 'expireArbitration',
    args: [wagerId],
    query: { enabled: confirm },
  })

  const { data: hash, writeContract, isPending, error } = useWriteContract()
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  if (isSuccess) {
    onDone()
    return <p className="font-sans text-xs text-green-400">✓ Arbitration voided — both parties refunded.</p>
  }

  if (!confirm) {
    return (
      <button
        onClick={() => setConfirm(true)}
        className="rounded border border-[#2a2a35] px-3 py-1.5 font-sans text-xs font-semibold text-[#b8b6b1] hover:border-red-500/50 hover:text-red-400"
      >
        Void expired arbitration
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
        {isPending ? 'Confirm…' : confirming ? 'Voiding…' : 'Confirm void (refund both)'}
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