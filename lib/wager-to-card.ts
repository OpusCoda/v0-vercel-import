import type { WagerDetails } from '@/hooks/useOpenWagers'

// Contract enum orders
const CATEGORY_LABELS = ['Crypto', 'Politics', 'Sports', 'Macro', 'PulseChain', 'Misc'] as const
const QUERY_LABELS: Record<string, string> = {
  '0x83245f6a6a2f6458558a706270fbcc35ac3a81917602c1313d3bfa998dcc2d4b': 'PLS',
  '0x1f462c114bb52b607b9458707c8b0502712d6f9e0bcab1dd184c3db3cfde7c6e': 'PLSX',
  '0xd510cabcca8d9d6dd6f2b15393a383b0c4978df7e8369459d2daedef4269c42e': 'HEX',
  '0x4a7e4a0f0c3ddff451d40e9b2c17e3050bc412794a5e53de9bf4db692611381c': 'INC',
}

function pls(v: bigint): number {
  return Number(v) / 1e18
}

function formatDeadline(eventDate: bigint): string {
  const d = new Date(Number(eventDate) * 1000)
  return `by ${d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
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
export interface P2PCardData {
  type: 'p2p'
  icon: string
  betType: string
  description: string
  deadline: string
  category: string
  yesData: { label: string; staked: number; wins: number; isTaken: boolean }
  noData: { label: string; staked: number; wins: number; isTaken: boolean }
  closesIn: string
  status: 'active' | 'open' | 'closed'
  id: string
  creator: string
  isPriceBet: boolean
  creatorBetsAbove: boolean
  targetPrice: number
  tokenLabel: string
}

export function wagerToCard(w: WagerDetails): P2PCardData {
  const isPriceBet = w.wagerType === 1
  const creatorStake = pls(w.creatorStake)
  const challengerStake = pls(w.challengerStake)

  // Build a readable description. For price bets, use the token + target + direction;
  // otherwise fall back to the free-text description the creator entered.
  let description = w.description
  if (isPriceBet) {
    const token = QUERY_LABELS[w.queryId?.toLowerCase()] ?? 'Token'
    const dir = w.creatorBetsAbove ? 'above' : 'below'
    const price = pls(w.targetPrice)
    // If the creator already wrote a description, prefer it; else synthesize.
    description = w.description && w.description.trim().length > 0
      ? w.description
      : `${token} ${dir} $${price}`
  }

  // Creator side = "YES" (the position they took). Challenger side = "NO" (open to take).
  // Winner of a side collects the OTHER side's stake, so wins = opposing stake.
  const yesData = {
    label: 'YES (taken)',
    staked: creatorStake,
    wins: challengerStake,
    isTaken: true,
  }
  const noData = {
    label: w.challenger === '0x0000000000000000000000000000000000000000'
      ? 'NO (open)'
      : 'NO (assigned)',
    staked: challengerStake,
    wins: creatorStake,
    isTaken: false,
  }

  return {
    type: 'p2p',
    icon: isPriceBet ? '💰' : '🎯',
    betType: isPriceBet ? 'PRICE BET' : 'STANDARD',
    description,
    deadline: formatDeadline(w.eventDate),
    category: CATEGORY_LABELS[w.category] ?? 'Misc',
    yesData,
    noData,
    closesIn: closesIn(w.depositDeadline),
    // 0 Created = open; 1 Active / 2 Voting = active; 3+ = closed/resolved.
    status: w.status === 0 ? 'open' : w.status === 1 || w.status === 2 ? 'active' : 'closed',
    id: w.id.toString(),
    creator: w.creator,
    isPriceBet,
    creatorBetsAbove: w.creatorBetsAbove,
    targetPrice: pls(w.targetPrice),
    tokenLabel: isPriceBet ? (QUERY_LABELS[w.queryId?.toLowerCase()] ?? 'Token') : '',
  }
}