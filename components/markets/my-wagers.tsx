'use client'
import { useMemo, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { MarketCard } from '@/components/landing/market-card'
import { GlobalMetrics } from '@/components/markets/global-metrics'
import { WagerActions } from '@/components/markets/wager-actions'
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
  // In the voting window where you have not voted yet
  if (
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
  const referralPendingWei = referralData
    ? (referralData as readonly [string, bigint, boolean, bigint, bigint, bigint, bigint])[5]
    : 0n
  const pendingReferral = plsNum(referralPendingWei)
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
  const { actionNeeded, awaiting, active, history, lockedPLS, won, lost } = useMemo(() => {
    const empty = { actionNeeded: [] as WagerDetails[], awaiting: [] as WagerDetails[], active: [] as WagerDetails[], history: [] as WagerDetails[], lockedPLS: 0n, won: 0, lost: 0 }
    if (!me) return empty
    const mine = wagers.filter(
      (w) => w.creator.toLowerCase() === me || w.challenger.toLowerCase() === me
    )
    const out = { ...empty, actionNeeded: [], awaiting: [], active: [], history: [] } as typeof empty
    for (const w of mine) {
      const isCreator = w.creator.toLowerCase() === me
      const myStake = isCreator ? w.creatorStake : w.challengerStake
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
      if (action === 'Awaiting acceptance') out.awaiting.push(w)
      else if (action) out.actionNeeded.push(w)
      else if (w.status === 1 || w.status === 2 || w.status === 4 || w.status === 0) out.active.push(w)
      else out.history.push(w)
    }
    // Newest first in each group
    const byIdDesc = (a: WagerDetails, b: WagerDetails) => Number(b.id - a.id)
    out.actionNeeded.sort(byIdDesc)
    out.awaiting.sort(byIdDesc)
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
    <section>
      {/* Global Metrics */}
      <GlobalMetrics
        lockedValuePLS={lockedPLS}
        pendingActionsCount={actionNeeded.length}
        claimablePLS={referralPendingWei}
        performance={{
          wins: won,
          losses: lost,
          percentage: won + lost > 0 ? Math.round((won * 100) / (won + lost)) : 0,
        }}
        isLoading={isLoading}
      />
      {/* Referral rewards claim button (separate from metrics) */}
      {pendingReferral > 0 && (
        <div className="mb-8 flex justify-end">
          <button
            onClick={() =>
              claimWrite({
                address: WAGER_MARKET_ADDRESS,
                abi: REFERRAL_ABI,
                functionName: 'claimReferralRewards',
              })
            }
            disabled={claimPending}
            className="rounded-lg border border-[#B87333]/40 px-4 py-2 font-sans text-sm font-semibold text-[#B87333] transition-colors hover:bg-[#B87333]/10 disabled:opacity-50"
          >
            {claimPending ? 'Claiming…' : `Claim ${pendingReferral.toLocaleString(undefined, { maximumFractionDigits: 0 })} PLS`}
          </button>
        </div>
      )}
      {isLoading ? (
        <div className="py-12 text-center">
          <p className="font-sans text-sm text-[#7c7a76]">Loading your wagers…</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Needs your action */}
          <div>
            <h3 className="mb-4 font-serif text-lg font-semibold text-orange-400">
              Needs your action
            </h3>
            {actionNeeded.length === 0 ? (
              <div className="rounded-lg border border-[#2a2a35] bg-[#101017] p-4 text-center">
                <p className="font-sans text-sm text-[#7c7a76]">No action needed right now.</p>
              </div>
            ) : (
              <div className="space-y-3 rounded-lg border border-[#2a2a35] bg-[#101017] p-4">
                {actionNeeded.map((w) => {
                  const action = actionFor(w, me!, now)
                  return (
                    <div key={`action-${w.id.toString()}`} className="flex items-center justify-between rounded border border-[#2a2a35] bg-[#0d0d12] p-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-[#e8e6e3]">
                          <span className="text-orange-400 mr-2">🟡</span>
                          {action}
                        </div>
                        <div className="mt-1 text-xs text-[#7c7a76]">
                          {wagerToCard(w).description}
                        </div>
                      </div>
                      <div className="ml-4 shrink-0">
                        <WagerActions wagerId={w.id} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          {/* Awaiting acceptance — your open wagers, waiting on a challenger */}
          {awaiting.length > 0 && (
            <div>
              <h3 className="mb-4 font-serif text-lg font-semibold text-[#B87333]">
                Awaiting acceptance
              </h3>
              <div className="space-y-3 rounded-lg border border-[#2a2a35] bg-[#101017] p-4">
                {awaiting.map((w) => (
                  <div key={`await-${w.id.toString()}`} className="flex items-center justify-between rounded border border-[#2a2a35] bg-[#0d0d12] p-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-[#e8e6e3]">
                        <span className="text-[#7c7a76]">Wager: </span>
                        {wagerToCard(w).description}
                      </div>
                    </div>
                    <div className="ml-4 shrink-0">
                      <WagerActions wagerId={w.id} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Active Positions - Unified Table */}
          {active.length > 0 && (
            <div>
              <h3 className="mb-4 font-serif text-lg font-semibold text-[#B87333]">
                Active Positions
              </h3>
              <div className="overflow-x-auto rounded-lg border border-[#2a2a35] bg-[#101017]">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#2a2a35] bg-[#0d0d12]">
                      <th className="px-4 py-3 text-left font-sans text-xs font-semibold text-[#7c7a76]">Type</th>
                      <th className="px-4 py-3 text-left font-sans text-xs font-semibold text-[#7c7a76]">Market</th>
                      <th className="px-4 py-3 text-left font-sans text-xs font-semibold text-[#7c7a76]">Status</th>
                      <th className="px-4 py-3 text-right font-sans text-xs font-semibold text-[#7c7a76]">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {active.map((w) => {
                      const isCreator = w.creator.toLowerCase() === me
                      const myStake = isCreator ? plsNum(w.creatorStake) : plsNum(w.challengerStake)
                      const card = wagerToCard(w)
                      const statusLabel = w.status === 0 ? 'Pending' : w.status === 2 ? 'Voting' : 'Active'
                      return (
                        <tr key={`pos-${w.id.toString()}`} className="border-t border-[#2a2a35] hover:bg-[#0d0d12]/50">
                          <td className="px-4 py-3 text-sm text-[#e8e6e3]">🤝 Outcome</td>
                          <td className="px-4 py-3 text-sm text-[#b8b6b1]">{card.description}</td>
                          <td className="px-4 py-3 text-sm text-[#7c7a76]">{statusLabel}</td>
                          <td className="px-4 py-3 text-right text-sm font-semibold text-[#B87333]">{myStake.toLocaleString(undefined, { maximumFractionDigits: 0 })} PLS</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {/* History */}
          {history.length > 0 && (
            <div>
              <h3 className="mb-4 font-serif text-lg font-semibold text-[#7c7a76]">
                History
              </h3>
              <div className="space-y-2 rounded-lg border border-[#2a2a35] bg-[#101017] p-4">
                {history.map((w) => {
                  const isCreator = w.creator.toLowerCase() === me
                  const myStake = isCreator ? plsNum(w.creatorStake) : plsNum(w.challengerStake)
                  const won = w.winner.toLowerCase() === me
                  const card = wagerToCard(w)
                  return (
                    <div key={`hist-${w.id.toString()}`} className="flex items-center justify-between rounded border border-[#2a2a35] bg-[#0d0d12] p-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-[#e8e6e3]">
                          {card.description}
                        </div>
                      </div>
                      <div className={`ml-4 shrink-0 text-sm font-semibold ${won ? 'text-green-400' : 'text-red-400'}`}>
                        {won ? '+' : '−'}{myStake.toLocaleString(undefined, { maximumFractionDigits: 0 })} PLS
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}