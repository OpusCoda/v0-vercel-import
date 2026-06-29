"use client"

import { useEffect, useRef } from "react"

// Genuine content only: the official X timeline embed renders each account's
// real latest posts (no fabricated entries, no public API key required).
const X_ACCOUNTS = [
  { handle: "OpusEco", name: "OpusEco", url: "https://twitter.com/OpusEco" },
  { handle: "RichardHeartWin", name: "Richard Heart", url: "https://twitter.com/RichardHeartWin" },
]

const X_ICON = (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

function loadTwitterWidgets(): Promise<void> {
  return new Promise((resolve) => {
    const w = window as unknown as { twttr?: { widgets: { load: (el?: HTMLElement) => void } } }
    if (w.twttr?.widgets) {
      resolve()
      return
    }
    const existing = document.getElementById("twitter-wjs") as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true })
      return
    }
    const script = document.createElement("script")
    script.id = "twitter-wjs"
    script.src = "https://platform.twitter.com/widgets.js"
    script.async = true
    script.onload = () => resolve()
    document.body.appendChild(script)
  })
}

function XTimeline({ handle, name, url }: { handle: string; name: string; url: string }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    loadTwitterWidgets().then(() => {
      if (cancelled || !containerRef.current) return
      const w = window as unknown as { twttr?: { widgets: { load: (el?: HTMLElement) => void } } }
      w.twttr?.widgets.load(containerRef.current)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="overflow-hidden rounded-2xl border border-[#2a2a35] bg-[#0d0d12]">
      <a
        href={`https://x.com/${handle}/`}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-2 border-b border-[#2a2a35] px-5 py-3"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e8e6e3]/10 text-[#e8e6e3] ring-1 ring-[#e8e6e3]/20">
          {X_ICON}
        </span>
        <span className="flex flex-col">
          <span className="font-sans text-sm font-semibold text-[#e8e6e3] group-hover:text-[#d4af37]">{name}</span>
          <span className="font-sans text-xs text-[#7c7a76]">@{handle}</span>
        </span>
      </a>
      <div ref={containerRef} className="px-2 py-1">
        <a
          className="twitter-timeline"
          data-theme="dark"
          data-tweet-limit="3"
          data-chrome="noheader nofooter noborders transparent"
          data-dnt="true"
          href={url}
        >
          {`Posts by @${handle}`}
        </a>
      </div>
    </div>
  )
}

export function LiveFeed() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-4 md:px-6">
      <div className="mb-5 flex items-center justify-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#d4af37] opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#d4af37]" />
        </span>
        <h3 className="font-sans text-sm font-semibold tracking-wide text-[#e8e6e3]">Live Feed</h3>
        <span className="font-sans text-xs text-[#7c7a76]">— Latest from the community</span>
      </div>

      <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
        {X_ACCOUNTS.map((acct) => (
          <XTimeline key={acct.handle} {...acct} />
        ))}
      </div>
    </section>
  )
}
