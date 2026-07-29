"use client"

import { useState, useEffect } from "react"

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

interface MarketEvent {
  id: string
  type: "market"
  timestamp: Date
  content: { question: string; yes: string; pool: string }
}

interface XPostEvent {
  id: string
  type: "x_post"
  timestamp: Date
  content: { handle: string; name: string; text: string; url: string }
}

interface StakeEvent {
  id: string
  type: "stake"
  timestamp: Date
  content: { label: string; amount: string; duration: string }
}

type FeedEvent = BurnEvent | DistributionEvent | MarketEvent | XPostEvent | StakeEvent

async function fetchXPosts(): Promise<FeedEvent[]> {
  try {
    const response = await fetch("/api/x-posts")
    const data = await response.json()

    if (!response.ok || !data.posts) {
      console.log("[v0] X posts API error:", data.error || "Unknown error")
      return []
    }

    const xPosts: FeedEvent[] = data.posts.map((post: Record<string, unknown>, index: number) => ({
      id: `x_${index}`,
      type: "x_post",
      category: "community" as const,
      timestamp: new Date(post.timestamp as string),
      content: {
        handle: post.handle,
        name: post.name,
        text: post.text,
        url: post.url,
      },
    }))

    if (data.errors && data.errors.length > 0) {
      console.log("[v0] X posts API warnings:", data.errors)
    }

    return xPosts
  } catch (err) {
    console.log("[v0] Failed to fetch X posts:", err instanceof Error ? err.message : String(err))
    return []
  }
}

function formatTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)

  if (diffMins < 1) return "now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${Math.floor(diffHours / 24)}d ago`
}

function FeedCard({ event }: { event: FeedEvent }) {
  switch (event.type) {
    case "burn":
      return (
        <div className="flex gap-3 rounded-xl border border-[#2a2a35] bg-[#0d0d12] p-4">
          <div className="text-2xl">🔥</div>
          <div className="flex-1">
            <div className="font-semibold text-[#e8e6e3]">{event.content.label}</div>
            <div className="text-sm text-[#9a9a9a]">{event.content.amount} permanently burned</div>
            <div className="text-xs text-[#7c7a76] mt-1">{formatTime(event.timestamp)}</div>
          </div>
        </div>
      )
    case "distribution":
      return (
        <div className="flex gap-3 rounded-xl border border-[#2a2a35] bg-[#0d0d12] p-4">
          <div className="text-2xl">💰</div>
          <div className="flex-1">
            <div className="font-semibold text-[#e8e6e3]">{event.content.label}</div>
            <div className="text-sm text-[#9a9a9a]">{event.content.amount} {event.content.token} distributed to holders</div>
            <div className="text-xs text-[#7c7a76] mt-1">{formatTime(event.timestamp)}</div>
          </div>
        </div>
      )
    case "market":
      return (
        <div className="flex gap-3 rounded-xl border border-[#2a2a35] bg-[#0d0d12] p-4">
          <div className="text-2xl">📊</div>
          <div className="flex-1">
            <div className="font-semibold text-[#e8e6e3]">Probability Shop</div>
            <div className="text-sm text-[#9a9a9a]">"{event.content.question}"</div>
            <div className="text-xs text-[#d4af37] mt-1">{event.content.yes} YES · {event.content.pool} pool</div>
            <div className="text-xs text-[#7c7a76] mt-1">{formatTime(event.timestamp)}</div>
          </div>
        </div>
      )
    case "x_post":
      return (
        <div className="flex gap-3 rounded-xl border border-[#2a2a35] bg-[#0d0d12] p-4">
          <div className="text-2xl">𝕏</div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#e8e6e3]">@{event.content.handle}</span>
              <span className="text-xs text-[#7c7a76]">·</span>
              <span className="text-xs text-[#7c7a76]">{formatTime(event.timestamp)}</span>
            </div>
            <div className="text-sm text-[#b8b6b1] mt-1">{event.content.text}</div>
            <a href={event.content.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#d4af37] hover:underline mt-2 inline-flex items-center gap-1">
              View on X ↗
            </a>
          </div>
        </div>
      )
    case "stake":
      return (
        <div className="flex gap-3 rounded-xl border border-[#2a2a35] bg-[#0d0d12] p-4">
          <div className="text-2xl">🔒</div>
          <div className="flex-1">
            <div className="font-semibold text-[#e8e6e3]">{event.content.label}</div>
            <div className="text-sm text-[#9a9a9a]">{event.content.amount} staked for {event.content.duration}</div>
            <div className="text-xs text-[#7c7a76] mt-1">{formatTime(event.timestamp)}</div>
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

  useEffect(() => {
    async function loadFeed() {
      const xPosts = await fetchXPosts()
      const allEvents = [...xPosts].sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
      )
      setEvents(allEvents)
      setLoading(false)
    }
    loadFeed()
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

      {/* Events Feed */}
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
