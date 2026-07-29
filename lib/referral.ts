// Client-side helpers for the off-chain referral capture flow.
// A pending referrer is stored locally until the user's first protocol
// interaction, at which point it would be bound on-chain / via server action.

const PENDING_KEY = "opus_pending_referrer"

// Fixed production base so shared links never inherit a preview domain.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://opuseco.com"

export type PendingReferrer = {
  ref: string // the referral value (name or address)
  wallet: string // resolved referrer wallet address
  capturedAt: number
}

// Save a resolved pending referrer (only the first one captured is kept).
export function setPendingReferrer(ref: string, wallet: string) {
  if (typeof window === "undefined") return
  try {
    if (localStorage.getItem(PENDING_KEY)) return // first referrer wins
    const data: PendingReferrer = { ref, wallet, capturedAt: Date.now() }
    localStorage.setItem(PENDING_KEY, JSON.stringify(data))
  } catch {
    // ignore storage errors (private mode, etc.)
  }
}

export function getPendingReferrer(): PendingReferrer | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(PENDING_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PendingReferrer
  } catch {
    return null
  }
}

export function clearPendingReferrer() {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(PENDING_KEY)
  } catch {
    // ignore
  }
}

// Build a shareable referral link for a given name, in the clean /r/<name> form.
// Always uses the production domain, never the current (possibly preview) origin.
export function buildReferralLink(name: string, origin?: string) {
  const base = origin || SITE_URL
  return `${base}/r/${encodeURIComponent(name)}`
}