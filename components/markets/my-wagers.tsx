'use client'
import { useMemo, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { MarketCard } from '@/components/landing/market-card'
import { useAllWagers } from '@/hooks/useAllWagers'
import { wagerToCard } from '@/lib/wager-to-card'
import { WAGER_MARKET_ADDRESS } from '@/lib/wager-market'
import type { WagerDetails } from '@/hooks/useOpenWagers'

const ZERO = '0x0000000000000000000000000000000000000000'

// getReferralInfo / claimReferralRewards exist on the deployed contract but not
// in the shared ABI subset — declared locally to avoid touching wager-market.ts.
const REFERRAL_ABI = [
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getReferralInfo',
    outputs: [
      { name: 'referredByAddr', type: 'address' },
      { name: 'startTime', type: 'uint256' },
      { name: 'isActive', type: 'bool' },
      { name: 'expiresAt', type: 'uint256' },
      { name: 'discountBps', type: 'uint256' },
      { name: 'pendingRewards', type: 'uint256' },
      { name: 'peopleReferred', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'claimReferralRewards',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const

function plsNum(v: bigint): number {
  return Number(v) / 1e18
}

// What (if anything) this wager needs from the connected user right now.
// Status enum: 0 Created, 1 Active, 2 Voting, 3 Resolved, 4 Arbitration, 5 Cancelled, 6 Voided
function actionFor(w: WagerDetails, me: string, now: number): string | null {
  const isCreator = w.creator.toLowerCase() === me
  const isChallenger = w.challenger.toLowerCase() === me
  if (w.status === 0) {
    if (isChallenger) return 'Accept or decline'          // directed at you, awaiting your deposit
    if (isCreator) return 'Awaiting acceptance'           // yours, still open (cancellable)
    return null
  }
  // Price bet past event date: resolvable (permissionless, but surface it)
  if (w.wagerType === 1 && w.status === 1 && now > Number(w.eventDate)) return 'Resolve (oracle)'
  // Standard wager in the voting window where you have not voted yet
  if (
    w.wagerType === 0 &&
    (w.status === 1 || w.status === 2) &&
    now >= Number(w.eventDate) &&
    now <= Number(w.votingDeadline)
  ) {
    const myVote = isCreator ? w.creatorVote : isChallenger ? w.challengerVote : ZERO
    if ((isCreator || isChallenger) && (!myVote || myVote === ZERO)) return 'Vote on the winner'
  }
  return null
}

function CardFor({ w }: { w: WagerDetails }) {
  const m = wagerToCard(w)
  return (
    <MarketCard
      type="p2p"
      id={m.id}
      icon={m.icon}
      betType={m.betType}
      description={m.description}
      deadline={m.deadline}
      category={m.category}
      yesData={m.yesData}
      noData={m.noData}
      closesIn={m.closesIn}
      creator={m.creator}
      isPriceBet={m.isPriceBet}
      creatorBetsAbove={m.creatorBetsAbove}
      targetPrice={m.targetPrice}
      tokenLabel={m.tokenLabel}
      status={m.status}
      eventDateTs={m.eventDateTs}
      winnerShort={m.winnerShort}
    />
  )
}

export function MyWagers() {
  const { address, isConnected } = useAccount()
  const { wagers, isLoading } = useAllWagers()

  // Referral rewards — one extra read; claim button when non-zero.
  const { data: referralData, refetch: refetchReferral } = useReadContract({
    address: WAGER_MARKET_ADDRESS,
    abi: REFERRAL_ABI,
    functionName: 'getReferralInfo',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 60000 },
  })
  const pendingReferral = referralData ? plsNum((referralData as readonly [string, bigint, boolean, bigint, bigint, bigint, bigint])[5]) : 0

  const { writeContract: claimWrite, isPending: claimPending, data: claimTx } = useWriteContract()
  const { isSuccess: claimConfirmed } = useWaitForTransactionReceipt({
    hash: claimTx,
    query: { enabled: !!claimTx },
  })
  useEffect(() => {
    if (claimConfirmed) refetchReferral()
  }, [claimConfirmed, refetchReferral])

  const me = address?.toLowerCase()
  const now = Math.floor(Date.now() / 1000)

  const { actionNeeded, active, history, lockedPLS, won, lost } = useMemo(() => {
    const empty = { actionNeeded: [] as WagerDetails[], active: [] as WagerDetails[], history: [] as WagerDetails[], lockedPLS: 0, won: 0, lost: 0 }
    if (!me) return empty
    const mine = wagers.filter(
      (w) => w.creator.toLowerCase() === me || w.challenger.toLowerCase() === me
    )
    const out = { ...empty, actionNeeded: [], active: [], history: [] } as typeof empty
    for (const w of mine) {
      const isCreator = w.creator.toLowerCase() === me
      const myStake = isCreator ? plsNum(w.creatorStake) : plsNum(w.challengerStake)
      if (w.status === 0) {
        // Created: only the creator's PLS is actually deposited.
        if (isCreator) out.lockedPLS += myStake
      } else if (w.status === 1 || w.status === 2 || w.status === 4) {
        out.lockedPLS += myStake
      } else if (w.status === 3) {
        if (w.winner.toLowerCase() === me) out.won++
        else out.lost++
      }
      const action = actionFor(w, me, now)
      if (action) out.actionNeeded.push(w)
      else if (w.status === 1 || w.status === 2 || w.status === 4 || w.status === 0) out.active.push(w)
      else out.history.push(w)
    }
    // Newest first in each group
    const byIdDesc = (a: WagerDetails, b: WagerDetails) => Number(b.id - a.id)
    out.actionNeeded.sort(byIdDesc)
    out.active.sort(byIdDesc)
    out.history.sort(byIdDesc)
    return out
  }, [wagers, me, now])

  if (!isConnected) {
    return (
      <div className="rounded-2xl border border-[#2a2a35] bg-[#101017] p-8 text-center">
        <p className="font-sans text-[#7c7a76]">Connect your wallet to see your wagers</p>
      </div>
    )
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      {/* Summary strip */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-lg border border-[#2a2a35] bg-[#101017] p-4">
          <p className="font-sans text-xs text-[#7c7a76]">Locked in wagers</p>
          <p className="mt-1 font-serif text-xl font-bold text-[#d4af37]">
            {lockedPLS.toLocaleString(undefined, { maximumFractionDigits: 0 })} PLS
          </p>
        </div>
        <div className="rounded-lg border border-[#2a2a35] bg-[#101017] p-4">
          <p className="font-sans text-xs text-[#7c7a76]">Need your action</p>
          <p className={`mt-1 font-serif text-xl font-bold ${actionNeeded.length > 0 ? 'text-orange-400' : 'text-[#b8b6b1]'}`}>
            {actionNeeded.length}
          </p>
        </div>
        <div className="rounded-lg border border-[#2a2a35] bg-[#101017] p-4">
          <p className="font-sans text-xs text-[#7c7a76]">Record</p>
          <p className="mt-1 font-serif text-xl font-bold text-[#b8b6b1]">
            <span className="text-green-400">{won}W</span>
            {' / '}
            <span className="text-red-400">{lost}L</span>
          </p>
        </div>
        <div className="rounded-lg border border-[#2a2a35] bg-[#101017] p-4">
          <p className="font-sans text-xs text-[#7c7a76]">Referral rewards</p>
          <div className="mt-1 flex items-center justify-between gap-2">
            <p className="font-serif text-xl font-bold text-[#d4af37]">
              {pendingReferral.toLocaleString(undefined, { maximumFractionDigits: 0 })} PLS
            </p>
            {pendingReferral > 0 && (
              <button
                onClick={() =>
                  claimWrite({
                    address: WAGER_MARKET_ADDRESS,
                    abi: REFERRAL_ABI,
                    functionName: 'claimReferralRewards',
                  })
                }
                disabled={claimPending}
                className="rounded border border-[#d4af37]/40 px-2 py-1 font-sans text-xs font-semibold text-[#d4af37] transition-colors hover:bg-[#d4af37]/10 disabled:opacity-50"
              >
                {claimPending ? '…' : 'Claim'}
              </button>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center">
          <p className="font-sans text-sm text-[#7c7a76]">Loading your wagers…</p>
        </div>
      ) : actionNeeded.length + active.length + history.length === 0 ? (
        <div className="py-12 text-center">
          <p className="font-sans text-sm text-[#7c7a76]">
            No wagers yet — create one or accept an open wager in the P2P market.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Action needed */}
          {actionNeeded.length > 0 && (
            <div>
              <h3 className="mb-3 font-serif text-lg font-semibold text-orange-400">
                Needs your action ({actionNeeded.length})
              </h3>
              <div className="grid gap-3 lg:grid-cols-2">
                {actionNeeded.map((w) => (
                  <CardFor key={`act-${w.id.toString()}`} w={w} />
                ))}
              </div>
            </div>
          )}
          {/* Active */}
          {active.length > 0 && (
            <div>
              <h3 className="mb-3 font-serif text-lg font-semibold text-[#d4af37]">
                Active ({active.length})
              </h3>
              <div className="grid gap-3 lg:grid-cols-2">
                {active.map((w) => (
                  <CardFor key={`live-${w.id.toString()}`} w={w} />
                ))}
              </div>
            </div>
          )}
          {/* History */}
          {history.length > 0 && (
            <div>
              <h3 className="mb-3 font-serif text-lg font-semibold text-[#7c7a76]">
                History ({history.length})
              </h3>
              <div className="grid gap-3 lg:grid-cols-2">
                {history.map((w) => (
                  <CardFor key={`hist-${w.id.toString()}`} w={w} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}