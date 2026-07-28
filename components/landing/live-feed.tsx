"use client"

import { useState } from "react"

type FilterType = "all" | "protocol" | "community" | "markets" | "burns" | "distributions"

interface FeedEvent {
  id: string
  type: "burn" | "distribution" | "market" | "x_post" | "stake"
  category: FilterType
  timestamp: Date
  content: Record<string, unknown>
}

// Sample unified feed events (in production, would come from API)
const SAMPLE_EVENTS: FeedEvent[] = [
  {
    id: "1",
    type: "burn",
    category: "burns",
    timestamp: new Date(Date.now() - 2 * 60000),
    content: { amount: "42,814", label: "Smaug Burn" },
  },
  {
    id: "2",
    type: "distribution",
    category: "distributions",
    timestamp: new Date(Date.now() - 7 * 60000),
    content: { amount: "1.28M", token: "PLS", label: "Opus Distribution" },
  },
  {
    id: "3",
    type: "market",
    category: "markets",
    timestamp: new Date(Date.now() - 18 * 60000),
    content: { question: "Will PLS close above $0.00010 this month?", yes: "62%", pool: "1.8M PLS" },
  },
  {
    id: "4",
    type: "x_post",
    category: "community",
    timestamp: new Date(Date.now() - 31 * 60000),
    content: { handle: "OpusEco", name: "Opus Eco", text: "New staking rewards have been distributed...", url: "https://x.com/OpusEco" },
  },
  {
    id: "5",
    type: "stake",
    category: "protocol",
    timestamp: new Date(Date.now() - 46 * 60000),
    content: { amount: "2.4M", label: "Smaug Stake", duration: "730 days" },
  },
]

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
            <a href={event.content.url as string} target="_blank" rel="noopener noreferrer" className="text-xs text-[#d4af37] hover:underline mt-2 inline-flex items-center gap-1">
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
  const [activeFilter, setActiveFilter] = useState<FilterType>("all")

  const filters: { id: FilterType; label: string }[] = [
    { id: "all", label: "All" },
    { id: "protocol", label: "Protocol" },
    { id: "community", label: "Community" },
    { id: "markets", label: "Markets" },
    { id: "burns", label: "Burns" },
    { id: "distributions", label: "Distributions" },
  ]

  const filteredEvents = activeFilter === "all" ? SAMPLE_EVENTS : SAMPLE_EVENTS.filter((e) => e.category === activeFilter)

  return (
    <section className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      <div className="mb-6 flex items-center justify-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#d4af37] opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#d4af37]" />
        </span>
        <h3 className="font-sans text-sm font-semibold tracking-wide text-[#e8e6e3]">Live Ecosystem Feed</h3>
      </div>

      {/* Filter Tabs */}
      <div className="flex justify-center gap-2 mb-6 flex-wrap">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
              activeFilter === filter.id
                ? "border-[#d4af37] bg-[#d4af37]/10 text-[#d4af37]"
                : "border-[#2a2a35] text-[#9a9a9a] hover:border-[#3a3a45] hover:text-[#b8b6b1]"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Events Feed */}
      <div className="space-y-3">
        {filteredEvents.map((event) => (
          <FeedCard key={event.id} event={event} />
        ))}
      </div>
    </section>
  )
}
