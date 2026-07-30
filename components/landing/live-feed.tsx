"use client"

import { useEffect, useState } from "react"

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

type FeedEvent = XPostEvent

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
  return (
    <article className="flex gap-3 rounded-xl border border-[#2a2a35] bg-[#0d0d12] p-4">
      <div className="text-2xl" aria-hidden="true">
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
}

export function LiveFeed() {
  const [events, setEvents] = useState<FeedEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadFeed() {
      const xPosts = await fetchXPosts()

      if (!cancelled) {
        setEvents(xPosts)
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
