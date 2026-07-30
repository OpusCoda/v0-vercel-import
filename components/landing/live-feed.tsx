"use client"
import { useEffect, useState } from "react"

// On-chain ecosystem events. X-post support has been removed; this feed will
// render real contract events (stakes, wagers, markets, burns, distributions)
// once an events source is wired up (e.g. a cached /api/feed route reading
// contract logs). The card renderer below already handles each event type, so
// wiring the data source is all that remains.

interface BurnEvent {
  id: string
  type: "burn"
  timestamp: Date
  content: { label: string; amount: string }
}
interface DistributionEvent {
  id: string
  type: "distribution"
  timestamp: Date
  content: { label: string; amount: string; token: string }
}
interface WagerEvent {
  id: string
  type: "wager"
  timestamp: Date
  content: { description: string; stake: string; status: string }
}
interface MarketEvent {
  id: string
  type: "market"
  timestamp: Date
  content: { question: string; yes: string; pool: string }
}
interface StakeEvent {
  id: string
  type: "stake"
  timestamp: Date
  content: { label: string; amount: string; duration: string }
}

type FeedEvent = BurnEvent | DistributionEvent | WagerEvent | MarketEvent | StakeEvent

// Placeholder for the on-chain events source. Returns nothing until the
// /api/feed route (or equivalent) is implemented. Wire it here.
async function fetchEvents(): Promise<FeedEvent[]> {
  return []
}

function formatTime(date: Date): string {
  const timestamp = date.getTime()
  if (Number.isNaN(timestamp)) return ""
  const now = Date.now()
  const diffMs = Math.max(0, now - timestamp)
  const diffMinutes = Math.floor(diffMs / 60_000)
  const diffHours = Math.floor(diffMs / 3_600_000)
  const diffDays = Math.floor(diffMs / 86_400_000)
  if (diffMinutes < 1) return "now"
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

function FeedCard({ event }: { event: FeedEvent }) {
  switch (event.type) {
    case "burn":
      return (
        <article className="flex gap-3 rounded-xl border border-[#2a2a35] bg-[#0d0d12] p-4">
          <div className="text-2xl" aria-hidden="true">🔥</div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-[#e8e6e3]">{event.content.label}</div>
            <div className="text-sm text-[#9a9a9a]">{event.content.amount} permanently burned</div>
            <div className="mt-1 text-xs text-[#7c7a76]">{formatTime(event.timestamp)}</div>
          </div>
        </article>
      )
    case "distribution":
      return (
        <article className="flex gap-3 rounded-xl border border-[#2a2a35] bg-[#0d0d12] p-4">
          <div className="text-2xl" aria-hidden="true">💰</div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-[#e8e6e3]">{event.content.label}</div>
            <div className="text-sm text-[#9a9a9a]">
              {event.content.amount} {event.content.token} distributed to holders
            </div>
            <div className="mt-1 text-xs text-[#7c7a76]">{formatTime(event.timestamp)}</div>
          </div>
        </article>
      )
    case "wager":
      return (
        <article className="flex gap-3 rounded-xl border border-[#2a2a35] bg-[#0d0d12] p-4">
          <div className="text-2xl" aria-hidden="true">🤝</div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-[#e8e6e3]">Outcome Exchange</div>
            <div className="text-sm text-[#9a9a9a]">"{event.content.description}"</div>
            <div className="mt-1 text-xs text-[#d4af37]">{event.content.stake} · {event.content.status}</div>
            <div className="mt-1 text-xs text-[#7c7a76]">{formatTime(event.timestamp)}</div>
          </div>
        </article>
      )
    case "market":
      return (
        <article className="flex gap-3 rounded-xl border border-[#2a2a35] bg-[#0d0d12] p-4">
          <div className="text-2xl" aria-hidden="true">📊</div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-[#e8e6e3]">Probability Shop</div>
            <div className="text-sm text-[#9a9a9a]">"{event.content.question}"</div>
            <div className="mt-1 text-xs text-[#d4af37]">{event.content.yes} YES · {event.content.pool} pool</div>
            <div className="mt-1 text-xs text-[#7c7a76]">{formatTime(event.timestamp)}</div>
          </div>
        </article>
      )
    case "stake":
      return (
        <article className="flex gap-3 rounded-xl border border-[#2a2a35] bg-[#0d0d12] p-4">
          <div className="text-2xl" aria-hidden="true">🔒</div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-[#e8e6e3]">{event.content.label}</div>
            <div className="text-sm text-[#9a9a9a]">
              {event.content.amount} staked for {event.content.duration}
            </div>
            <div className="mt-1 text-xs text-[#7c7a76]">{formatTime(event.timestamp)}</div>
          </div>
        </article>
      )
    default:
      return null
  }
}

export function LiveFeed() {
  const [events, setEvents] = useState<FeedEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function loadFeed() {
      const feed = await fetchEvents()
      if (!cancelled) {
        setEvents(feed.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()))
        setLoading(false)
      }
    }
    void loadFeed()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      <div className="mb-6 flex items-center justify-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#d4af37] opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#d4af37]" />
        </span>
        <h3 className="font-sans text-sm font-semibold tracking-wide text-[#e8e6e3]">Live Ecosystem Feed</h3>
      </div>

      {loading ? (
        <p className="text-center text-sm text-[#7c7a76]">Loading feed…</p>
      ) : events.length === 0 ? (
        <p className="text-center text-sm text-[#7c7a76]">No recent activity.</p>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <FeedCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </section>
  )
}