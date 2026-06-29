"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { ethers } from "ethers"
import { Flame, ExternalLink } from "lucide-react"
import { SMAUG_ADDRESS, SMAUG_ABI, BURN_ADDRESS, getProvider, rpcRetry, formatWithCommas } from "@/lib/onchain"

type FeedItem = {
  id: string
  kind: "burn" | "post"
  live?: boolean
  // burn
  title?: string
  detail?: string
  // post
  handle?: string
  name?: string
  text?: string
  url?: string
}

// Curated X profiles to surface in the feed (no public API, so these link out
// to the real accounts rather than fabricating individual posts/timestamps).
const X_POSTS: FeedItem[] = [
  {
    id: "post-opuseco",
    kind: "post",
    handle: "@OpusEco",
    name: "OpusEco",
    text: "Official updates on Opus, Coda & Smaug — burns, reflections and ecosystem news.",
    url: "https://x.com/OpusEco/",
  },
  {
    id: "post-rhw",
    kind: "post",
    handle: "@RichardHeartWin",
    name: "Richard Heart",
    text: "PulseChain founder — protocol news, self-custody and community building.",
    url: "https://x.com/RichardHeartWin/",
  },
]

const X_ICON = (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

function FeedRow({ item }: { item: FeedItem }) {
  const ref = useRef<HTMLLIElement>(null)

  // Genuine "new entry" flash: light gold background fading to transparent.
  useEffect(() => {
    if (item.live && ref.current) {
      ref.current.animate(
        [
          { backgroundColor: "rgba(212, 175, 55, 0.18)", opacity: 0, transform: "translateY(-10px)" },
          { backgroundColor: "rgba(212, 175, 55, 0.10)", opacity: 1, transform: "translateY(0)" },
          { backgroundColor: "transparent", opacity: 1, transform: "translateY(0)" },
        ],
        { duration: 1100, easing: "ease-out", fill: "forwards" },
      )
    }
  }, [item.live])

  return (
    <li ref={ref} className="flex items-start gap-3 border-b border-[#1c1c24] px-5 py-3.5">
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

      {item.live && (
        <span className="shrink-0 font-sans text-[11px] font-medium text-[#d4af37]">just now</span>
      )}
    </li>
  )
}

export function LiveFeed() {
  const [burnedMillions, setBurnedMillions] = useState<number | null>(null)
  const [liveIds, setLiveIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    let cancelled = false

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
        const millions = Math.floor(Number(ethers.formatEther(burned)) / 1_000_000)
        if (cancelled) return
        setBurnedMillions((prev) => {
          // Only flag entries as "live" when a genuinely new milestone is crossed
          // while the user is watching — never on the initial load.
          if (prev !== null && millions > prev) {
            const fresh = new Set<string>()
            for (let m = prev + 1; m <= millions; m++) fresh.add(`burn-${m}`)
            setLiveIds(fresh)
          }
          return millions
        })
      } catch (err) {
        console.error("[v0] Error fetching Smaug burned for feed:", err)
      }
    }

    fetchBurned()
    const t = setInterval(fetchBurned, 45000)
    return () => {
      cancelled = true
      clearInterval(t)
    }
  }, [])

  // Real entries only: recent burn milestones (newest on top) + curated X profiles.
  const items = useMemo<FeedItem[]>(() => {
    if (burnedMillions === null) return []
    const burnItems: FeedItem[] = []
    const count = Math.min(6, burnedMillions)
    for (let i = 0; i < count; i++) {
      const milestone = burnedMillions - i
      burnItems.push({
        id: `burn-${milestone}`,
        kind: "burn",
        live: liveIds.has(`burn-${milestone}`),
        title: `${formatWithCommas(milestone)}M SMAUG burned`,
        detail: "Burn milestone reached — supply permanently reduced.",
      })
    }
    return [...burnItems, ...X_POSTS]
  }, [burnedMillions, liveIds])

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

        <ul className="relative max-h-[360px] overflow-y-auto" aria-label="Live ecosystem feed" aria-live="polite">
          {items.length === 0 ? (
            <li className="flex h-[200px] items-center justify-center font-sans text-sm text-[#7c7a76]">
              Waiting for live on-chain activity…
            </li>
          ) : (
            items.map((item) => <FeedRow key={item.id} item={item} />)
          )}
        </ul>
      </div>
    </section>
  )
}
