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

type FeedEvent =
  | BurnEvent
  | DistributionEvent
  | MarketEvent
  | XPostEvent
  | StakeEvent

interface XApiPost {
  id: string
  handle: string
  name: string
  text: string
  url: string
  timestamp: string
}

interface XPostsResponse {
  posts?: XApiPost[]
  errors?: string[]
  error?: string
}

async function fetchXPosts(): Promise<XPostEvent[]> {
  const response = await fetch("/api/x-posts", {
    method: "GET",
    cache: "no-store",
  })

  const data = (await response.json()) as XPostsResponse

  if (!response.ok) {
    throw new Error(
      data.error ?? `Feed request failed with ${response.status}`
    )
  }

  if (data.errors?.length) {
    console.warn("[LiveFeed] Some X accounts failed:", data.errors)
  }

  return (data.posts ?? []).map((post) => ({
    id: `x_${post.id}`,
    type: "x_post",
    timestamp: new Date(post.timestamp),
    content: {
      handle: post.handle,
      name: post.name,
      text: post.text,
      url: post.url,
    },
  }))
}

function formatTime(date: Date): string {
  const time = date.getTime()

  if (Number.isNaN(time)) {
    return ""
  }

  const now = Date.now()
  const diffMs = Math.max(0, now - time)
  const diffMins = Math.floor(diffMs / 60_000)
  const diffHours = Math.floor(diffMs / 3_600_000)
  const diffDays = Math.floor(diffMs / 86_400_000)

  if (diffMins < 1) return "now"
  if (diffMins < 60) return `${diffMins}m ago`
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
              {event.content.amount} {event.content.token} distributed
              to holders
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
              "{event.content.question}"
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
        <article className="flex gap-3 rounded-xl border border-[#2a2a35] bg-[#0d0d12] p-4">
          <div
            className="text-2xl"
            aria-hidden="true"
          >
            𝕏
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="font-semibold text-[#e8e6e3]">
                {event.content.name}
              </span>

              <span className="text-sm text-[#7c7a76]">
                @{event.content.handle}
              </span>

              <span className="text-xs text-[#7c7a76]">
                · {formatTime(event.timestamp)}
              </span>
            </div>

            <p className="mt-1 whitespace-pre-wrap break-words text-sm text-[#b8b6b1]">
              {event.content.text}
            </p>

            <a
              href={event.content.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs text-[#d4af37] hover:underline"
            >
              View on X
              <span aria-hidden="true">↗</span>
            </a>
          </div>
        </article>
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
              {event.content.amount} staked for{" "}
              {event.content.duration}
            </div>

            <div className="mt-1 text-xs text-[#7c7a76]">
              {formatTime(event.timestamp)}
            </div>
          </div>
        </div>
      )

    default:
      return null
  }
}

export function LiveFeed() {
  const [events, setEvents] = useState<FeedEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadFeed() {
      try {
        setLoading(true)
        setError(null)

        const xPosts = await fetchXPosts()

        if (cancelled) return

        const sortedEvents = [...xPosts].sort(
          (a, b) =>
            b.timestamp.getTime() - a.timestamp.getTime()
        )

        setEvents(sortedEvents)
      } catch (err) {
        if (cancelled) return

        console.error("[LiveFeed] Failed to load feed:", err)

        setError(
          err instanceof Error
            ? err.message
            : "Could not load the feed."
        )
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
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
      ) : error ? (
        <p className="text-center text-sm text-red-400">
          Unable to load recent X posts.
        </p>
      ) : events.length === 0 ? (
        <p className="text-center text-sm text-[#7c7a76]">
          No recent activity.
        </p>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <FeedCard
              key={event.id}
              event={event}
            />
          ))}
        </div>
      )}
    </section>
  )
}
