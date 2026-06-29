"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { ethers } from "ethers"
import { Flame, ExternalLink } from "lucide-react"
import { SMAUG_ADDRESS, SMAUG_ABI, BURN_ADDRESS, getProvider, rpcRetry, formatWithCommas } from "@/lib/onchain"

type FeedItem = {
  id: string
  kind: "burn" | "post"
  // burn
  title?: string
  detail?: string
  // post
  handle?: string
  name?: string
  text?: string
  url?: string
}

// Curated X post previews (no public API — content is hand-maintained).
const X_POSTS: FeedItem[] = [
  {
    id: "post-opuseco-1",
    kind: "post",
    handle: "@OpusEco",
    name: "OpusEco",
    text: "Every transaction strengthens the hoard. Smaug keeps burning, holders keep earning.",
    url: "https://x.com/OpusEco/",
  },
  {
    id: "post-rhw-1",
    kind: "post",
    handle: "@RichardHeartWin",
    name: "Richard Heart",
    text: "PulseChain keeps shipping. Self-custody, low fees, and a community that actually builds.",
    url: "https://x.com/RichardHeartWin/",
  },
  {
    id: "post-opuseco-2",
    kind: "post",
    handle: "@OpusEco",
    name: "OpusEco",
    text: "Holding Opus & Coda pays you in PLS and PLSX reflections — automatically, every block.",
    url: "https://x.com/OpusEco/",
  },
]

const X_ICON = (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

function relativeTime(secondsAgo: number) {
  if (secondsAgo < 60) return "just now"
  const m = Math.floor(secondsAgo / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

export function LiveFeed() {
  const [burnedMillions, setBurnedMillions] = useState<number | null>(null)
  const [paused, setPaused] = useState(false)
  const [order, setOrder] = useState(0)

  useEffect(() => {
    const fetchBurned = async () => {
      try {
        const provider = getProvider()
        const smaug = new ethers.Contract(SMAUG_ADDRESS, SMAUG_ABI, provider)
        let burned
        try {
          burned = await rpcRetry(() => smaug.totalBurned())
        } catch {
          burned = await rpcRetry(() => smaug.balanceOf(BURN_ADDRESS))
        }
        const total = Number(ethers.formatEther(burned))
        setBurnedMillions(Math.floor(total / 1_000_000))
      } catch (err) {
        console.error("[v0] Error fetching Smaug burned for feed:", err)
      }
    }
    fetchBurned()
  }, [])

  // Build the feed: real burn milestones (each extra million) + curated X posts.
  const items = useMemo<FeedItem[]>(() => {
    const burnItems: FeedItem[] = []
    if (burnedMillions !== null) {
      // Most recent ~8 million-thresholds crossed, newest (highest) first.
      const count = Math.min(8, burnedMillions)
      for (let i = 0; i < count; i++) {
        const milestone = burnedMillions - i
        burnItems.push({
          id: `burn-${milestone}`,
          kind: "burn",
          title: `${formatWithCommas(milestone)}M SMAUG burned`,
          detail:
            i === 0
              ? "Latest burn milestone reached — supply permanently reduced."
              : "Burn milestone — supply permanently reduced.",
        })
      }
    }

    // Interleave posts between burn milestones so the feed feels varied.
    const merged: FeedItem[] = []
    let bi = 0
    let pi = 0
    while (bi < burnItems.length || pi < X_POSTS.length) {
      if (bi < burnItems.length) merged.push(burnItems[bi++])
      if (bi < burnItems.length) merged.push(burnItems[bi++])
      if (pi < X_POSTS.length) merged.push(X_POSTS[pi++])
    }
    return merged
  }, [burnedMillions])

  // Auto-advance: rotate the list so a "new" item slides in on top.
  useEffect(() => {
    if (paused || items.length <= 1) return
    const t = setInterval(() => setOrder((o) => (o + 1) % items.length), 3500)
    return () => clearInterval(t)
  }, [paused, items.length])

  const rotated = useMemo(() => {
    if (items.length === 0) return []
    return items.map((_, i) => items[(i + order) % items.length])
  }, [items, order])

  // Synthetic "time since" that increases as items rotate down the list.
  const baseRef = useRef(Date.now())

  return (
    <section className="mx-auto max-w-7xl px-4 pb-4 md:px-6">
      <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-[#2a2a35] bg-[#0d0d12]">
        <div className="flex items-center justify-between border-b border-[#2a2a35] px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#d4af37] opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#d4af37]" />
            </span>
            <h3 className="font-sans text-sm font-semibold tracking-wide text-[#e8e6e3]">Live Feed</h3>
          </div>
          <span className="font-sans text-xs text-[#7c7a76]">Burns &amp; community updates</span>
        </div>

        <ul
          className="relative h-[340px] overflow-hidden"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          aria-label="Live ecosystem feed"
        >
          {rotated.length === 0 && (
            <li className="flex h-full items-center justify-center font-sans text-sm text-[#7c7a76]">
              Loading live data…
            </li>
          )}
          {rotated.map((item, idx) => (
            <li
              key={`${item.id}-${order}`}
              className={`flex items-start gap-3 border-b border-[#1c1c24] px-5 py-3.5 transition-all duration-500 ${
                idx === 0 ? "animate-[feedIn_0.5s_ease-out] bg-[#12121a]" : ""
              }`}
            >
              {item.kind === "burn" ? (
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#d4af37]/10 ring-1 ring-[#d4af37]/30">
                  <Flame className="h-4 w-4 text-[#d4af37]" />
                </span>
              ) : (
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e8e6e3]/10 text-[#e8e6e3] ring-1 ring-[#e8e6e3]/20">
                  {X_ICON}
                </span>
              )}

              <div className="min-w-0 flex-1">
                {item.kind === "burn" ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-[#d4af37]/15 px-1.5 py-0.5 font-sans text-[10px] font-semibold uppercase tracking-wider text-[#d4af37]">
                        Protocol
                      </span>
                      <span className="truncate font-sans text-sm font-semibold text-[#e8e6e3]">{item.title}</span>
                    </div>
                    <p className="mt-0.5 truncate font-sans text-xs text-[#9ca3af]">{item.detail}</p>
                  </>
                ) : (
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="group block">
                    <div className="flex items-center gap-2">
                      <span className="font-sans text-sm font-semibold text-[#e8e6e3]">{item.name}</span>
                      <span className="font-sans text-xs text-[#7c7a76]">{item.handle}</span>
                      <ExternalLink className="h-3 w-3 text-[#7c7a76] transition-colors group-hover:text-[#d4af37]" />
                    </div>
                    <p className="mt-0.5 line-clamp-2 font-sans text-xs leading-relaxed text-[#9ca3af] group-hover:text-[#c9c7c3]">
                      {item.text}
                    </p>
                  </a>
                )}
              </div>

              <span className="shrink-0 font-sans text-[11px] text-[#5f5d59]">
                {relativeTime((idx + 1) * 47 + Math.floor((Date.now() - baseRef.current) / 1000))}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
