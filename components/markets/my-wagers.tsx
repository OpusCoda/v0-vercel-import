'use client'
import { useAccount } from 'wagmi'
import { useUserWagers } from '@/hooks/useUserWagers'
import type { WagerDetails } from '@/hooks/useOpenWagers'

const ZERO = '0x0000000000000000000000000000000000000000'

function pls(v: bigint): string {
  return (Number(v) / 1e18).toLocaleString('en-US', { maximumFractionDigits: 2 })
}

function typeLabel(t: number) {
  return t === 1 ? 'Price Bet' : 'Standard'
}

// Outcome for a completed wager, from this user's perspective.
function outcomeFor(w: WagerDetails, me: string): { label: string; cls: string } {
  if (w.status === 5) return { label: 'Cancelled', cls: 'text-[#9a9a9a]' }
  if (w.status === 6) return { label: 'Voided — refunded', cls: 'text-[#9a9a9a]' }
  if (w.status === 3) {
    if (!w.winner || w.winner === ZERO) return { label: 'Resolved', cls: 'text-[#9a9a9a]' }
    const won = w.winner.toLowerCase() === me.toLowerCase()
    return won
      ? { label: 'Won', cls: 'text-green-400' }
      : { label: 'Lost', cls: 'text-red-400' }
  }
  return { label: 'Settled', cls: 'text-[#9a9a9a]' }
}

function roleLabel(w: WagerDetails, me: string) {
  return w.creator.toLowerCase() === me.toLowerCase() ? 'You created' : 'You accepted'
}

function WagerRow({ w, me, showOutcome }: { w: WagerDetails; me: string; showOutcome?: boolean }) {
  const outcome = showOutcome ? outcomeFor(w, me) : null
  // Net payout on a win = pot (fees are small; exact figure is on the card / quote)
  const pot = w.creatorStake + w.challengerStake
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-[#09090B] px-4 py-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-[#666]">#{w.id.toString()}</span>
          <span className="text-sm font-semibold text-[#f4f4f4] truncate">{w.description}</span>
        </div>
        <div className="mt-0.5 text-xs text-[#9a9a9a]">
          {typeLabel(w.wagerType)} · {roleLabel(w, me)} · {pls(pot)} PLS pot
        </div>
      </div>
      {outcome && (
        <span className={`shrink-0 text-sm font-semibold ${outcome.cls}`}>{outcome.label}</span>
      )}
    </div>
  )
}

function Group({
  title,
  wagers,
  me,
  showOutcome,
  emptyHint,
}: {
  title: string
  wagers: WagerDetails[]
  me: string
  showOutcome?: boolean
  emptyHint: string
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <h3 className="text-sm font-semibold text-[#f4f4f4]">{title}</h3>
        <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-[#9a9a9a]">{wagers.length}</span>
      </div>
      {wagers.length === 0 ? (
        <p className="text-xs text-[#666] pb-2">{emptyHint}</p>
      ) : (
        <div className="space-y-2">
          {wagers.map((w) => (
            <WagerRow key={w.id.toString()} w={w} me={me} showOutcome={showOutcome} />
          ))}
        </div>
      )}
    </div>
  )
}

export function MyWagers() {
  const { address, isConnected } = useAccount()
  const { pending, active, completed, isLoading } = useUserWagers()

  if (!isConnected || !address) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#111116] p-8 text-center">
        <p className="text-[#9a9a9a]">Connect your wallet to see your wagers</p>
      </div>
    )
  }

  const total = pending.length + active.length + completed.length

  return (
    <div className="rounded-2xl border border-white/10 bg-[#111116] p-6">
      <h2 className="font-serif text-xl font-bold text-[#e8e6e3] mb-4">My Wagers</h2>
      {isLoading && total === 0 ? (
        <p className="text-center text-[#9a9a9a] py-6 text-sm">Loading your wagers…</p>
      ) : total === 0 ? (
        <div className="text-center py-8">
          <div className="text-[#9a9a9a] text-sm mb-1">You haven't placed any wagers yet</div>
          <div className="text-[#666] text-xs">Create one above or accept an open wager</div>
        </div>
      ) : (
        <div className="space-y-6">
          <Group
            title="Pending"
            wagers={pending}
            me={address}
            emptyHint="No wagers awaiting a taker."
          />
          <Group
            title="Active"
            wagers={active}
            me={address}
            emptyHint="No matched wagers in progress."
          />
          <Group
            title="Completed"
            wagers={completed}
            me={address}
            showOutcome
            emptyHint="No settled wagers yet."
          />
        </div>
      )}
    </div>
  )
}
