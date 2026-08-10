import type { WagerDetails } from '@/hooks/useOpenWagers'
// Contract enum order
const CATEGORY_LABELS = ['Crypto', 'Politics', 'Sports', 'Macro', 'PulseChain', 'Misc'] as const
function pls(v: bigint): number {
  return Number(v) / 1e18
}
const ZERO = '0x0000000000000000000000000000000000000000'
function shortAddr(a?: string): string {
  if (!a || a === ZERO) return ''
  return `${a.slice(0, 4)}...${a.slice(-4)}`
}
function formatDeadline(eventDate: bigint): string {
  const d = new Date(Number(eventDate) * 1000)
  return `by ${d.toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`
}
function closesIn(depositDeadline: bigint): string {
  const secs = Number(depositDeadline) - Math.floor(Date.now() / 1000)
  if (secs <= 0) return 'closed'
  const days = Math.floor(secs / 86400)
  if (days >= 1) return `${days} day${days === 1 ? '' : 's'}`
  const hours = Math.floor(secs / 3600)
  return `${hours} hour${hours === 1 ? '' : 's'}`
}
// The card's P2PMarket shape (mirror of the interface in markets-list.tsx)
export type P2PCardData = {
  type: 'p2p'
  icon: string
  betType: string
  description: string
  deadline: string
  category: string
  yesData: { label: string; staked: number; wins: number; isTaken: boolean }
  noData: { label: string; staked: number; wins: number; isTaken: boolean }
  closesIn: string
  status: 'active' | 'open' | 'closed' | 'arbitration'
  id: string
  creator: string
  eventDateTs: number
  winnerShort: string  // '' if unresolved
}
export function wagerToCard(w: WagerDetails): P2PCardData {
  const creatorStake = pls(w.creatorStake)
  const challengerStake = pls(w.challengerStake)
  // Creator side = "YES" (the position they took). Challenger side = "NO" (open to take).
  // Winner of a side collects the OTHER side's stake, so wins = opposing stake.
  const yesData = {
    label: 'YES (taken)',
    staked: creatorStake,
    wins: challengerStake,
    isTaken: true,
  }
  const noData = {
    label: w.challenger === ZERO ? 'NO (open)' : 'NO (assigned)',
    staked: challengerStake,
    wins: creatorStake,
    isTaken: false,
  }
  return {
    type: 'p2p',
    icon: '🎯',
    betType: 'WAGER',
    description: w.description,
    deadline: formatDeadline(w.eventDate),
    category: CATEGORY_LABELS[w.category] ?? 'Misc',
    yesData,
    noData,
    closesIn: closesIn(w.depositDeadline),
    // Status enum: 0 Created, 1 Active, 2 Voting, 3 Resolved,
    // 4 Arbitration, 5 Cancelled, 6 Voided.
    // Arbitration is NOT closed — the wager is unsettled and can still pay
    // either party or void. It gets its own bucket so the card can say so.
    status:
      w.status === 0
        ? 'open'
        : w.status === 1 || w.status === 2
          ? 'active'
          : w.status === 4
            ? 'arbitration'
            : 'closed',
    id: w.id.toString(),
    creator: w.creator,
    eventDateTs: Number(w.eventDate),
    winnerShort: shortAddr(w.winner),
  }
}