"use client"

import { useEffect, useState } from "react"

interface BurnEvent {
  id: string
  type: "burn"
  timestamp: Date
  content: {
    label: string
    amount: string
  }
}

interface DistributionEvent {
  id: string
  type: "distribution"
  timestamp: Date
  content: {
    label: string
    amount: string
    token: string
  }
}

interface MarketEvent {
  id: string
  type: "market"
  timestamp: Date
  content: {
    question: string
    yes: string
    pool: string
  }
}

interface XPostEvent {
  id: string
  type: "x_post"
  timestamp: Date
  content: {
    handle: string
    name: string
    text: string
    url: string
  }
}

interface StakeEvent {
  id: string
  type: "stake"
  timestamp: Date
  content: {
    label: string
    amount: string
    duration: string
  }
}

interface XPostApiResponse {
  id: string
  type: "x_post"
  timestamp: string
  content: {
    handle: string
    name: string
    text: string
    url: string
  }
}

type FeedEvent =
  | BurnEvent
  | DistributionEvent
  | MarketEvent
  | XPostEvent
  | StakeEvent

async function fetchXPosts(): Promise<XPostEvent[]> {
  try {
    const response = await fetch("/api/x-posts", {
      cache: "no-store",
    })

    if (!response.ok) {
      console.error("Failed to fetch X posts:", response.status)
      return []
    }

    const posts: unknown = await response.json()

    if (!Array.isArray(posts)) {
      console.error("X posts response was not an array")
      return []
    }

    return (posts as XPostApiResponse[]).map(
      (post): XPostEvent => ({
        ...post,
        timestamp: new Date(post.timestamp),
      }),
    )
  } catch (error) {
    console.error(
      "Failed to fetch X posts:",
      error instanceof Error ? error.message : String(error),
    )

    return []
  }
}

function createTemporaryEvents(): FeedEvent[] {
  const now = Date.now()

  return [
    {
      id: "burn_1",
      type: "burn",
      timestamp: new Date(now - 8 * 60 * 1000),
      content: {
        label: "Smaug Burn",
        amount: "125,000 SMAUG",
      },
    },
    {
      id: "distribution_1",
      type: "distribution",
      timestamp: new Date(now - 24 * 60 * 1000),
      content: {
        label: "Opus Distribution",
        amount: "2,450,000",
        token: "PLS",
      },
    },
    {
      id: "stake_1",
      type: "stake",
      timestamp: new Date(now - 47 * 60 * 1000),
      content: {
        label: "New Smaug Stake",
        amount: "1,250,000 SMAUG",
        duration: "365 days",
      },
    },
    {
      id: "market_1",
      type: "market",
      timestamp: new Date(now - 82 * 60 * 1000),
      content: {
        question: "Will PLS reach $0.0001 before 2027?",
        yes: "64%",
        pool: "8,750,000 PLS",
      },
    },
    {
      id: "distribution_2",
      type: "distribution",
      timestamp: new Date(now - 3 * 60 * 60 * 1000),
      content: {
        label: "Coda Distribution",
        amount: "785,000",
        token: "PLSX",
      },
    },
  ]
}

function formatTime(date: Date): string {
  const timestamp = date.getTime()

  if (Number.isNaN(timestamp)) {
    return ""
  }

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
        <div className="flex gap-3 rounded-xl border border-[#2a2a35] bg-[#0d0d12] p-4">
          <div className="text-2xl">🔥</div>

          <div className="min-w-0 flex-1">
            <div className="font-semibold text-[#e8e6e3]">
              {event.content.label}
            </div>

            <div className="text-sm text-[#9a9a9a]">
              {event.content.amount} permanently burned
            </div>

            <div className="mt-1 text-xs text-[#7c7a76]">
              {formatTime(event.timestamp)}
            </div>
          </div>
        </div>
      )

    case "distribution":
      return (
        <div className="flex gap-3 rounded-xl border border-[#2a2a35] bg-[#0d0d12] p-4">
          <div className="text-2xl">💰</div>

          <div className="min-w-0 flex-1">
            <div className="font-semibold text-[#e8e6e3]">
              {event.content.label}
            </div>

            <div className="text-sm text-[#9a9a9a]">
              {event.content.amount} {event.content.token} distributed to
              holders
            </div>

            <div className="mt-1 text-xs text-[#7c7a76]">
              {formatTime(event.timestamp)}
            </div>
          </div>
        </div>
      )

    case "market":
      return (
        <div className="flex gap-3 rounded-xl border border-[#2a2a35] bg-[#0d0d12] p-4">
          <div className="text-2xl">📊</div>

          <div className="min-w-0 flex-1">
            <div className="font-semibold text-[#e8e6e3]">
              Probability Shop
            </div>

            <div className="text-sm text-[#9a9a9a]">
              “{event.content.question}”
            </div>

            <div className="mt-1 text-xs text-[#d4af37]">
              {event.content.yes} YES · {event.content.pool} pool
            </div>

            <div className="mt-1 text-xs text-[#7c7a76]">
              {formatTime(event.timestamp)}
            </div>
          </div>
        </div>
      )

    case "x_post":
      return (
        <div className="flex gap-3 rounded-xl border border-[#2a2a35] bg-[#0d0d12] p-4">
          <div className="text-2xl">𝕏</div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-[#e8e6e3]">
                @{event.content.handle}
              </span>

              <span className="text-xs text-[#7c7a76]">·</span>

              <span className="text-xs text-[#7c7a76]">
                {formatTime(event.timestamp)}
              </span>
            </div>

            <div className="mt-1 whitespace-pre-wrap wrap-break-word text-sm text-[#b8b6b1]">
              {event.content.text}
            </div>

            <a
              href={event.content.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs text-[#d4af37] hover:underline"
            >
              View on X ↗
            </a>
          </div>
        </div>
      )

    case "stake":
      return (
        <div className="flex gap-3 rounded-xl border border-[#2a2a35] bg-[#0d0d12] p-4">
          <div className="text-2xl">🔒</div>

          <div className="min-w-0 flex-1">
            <div className="font-semibold text-[#e8e6e3]">
              {event.content.label}
            </div>

            <div className="text-sm text-[#9a9a9a]">
              {event.content.amount} staked for {event.content.duration}
            </div>

            <div className="mt-1 text-xs text-[#7c7a76]">
              {formatTime(event.timestamp)}
            </div>
          </div>
        </div>
      )
  }
}

export function LiveFeed() {
  const [events, setEvents] = useState<FeedEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadFeed() {
      const temporaryEvents = createTemporaryEvents()
      const xPosts = await fetchXPosts()

      const allEvents: FeedEvent[] = [
        ...temporaryEvents,
        ...xPosts,
      ].sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
      )

      if (!cancelled) {
        setEvents(allEvents)
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

        <h3 className="font-sans text-sm font-semibold tracking-wide text-[#e8e6e3]">
          Live Ecosystem Feed
        </h3>
      </div>

      {loading ? (
        <p className="text-center text-sm text-[#7c7a76]">
          Loading feed…
        </p>
      ) : events.length === 0 ? (
        <p className="text-center text-sm text-[#7c7a76]">
          No recent activity.
        </p>
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