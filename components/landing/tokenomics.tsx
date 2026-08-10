"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Flame, Sprout, Vault, Droplet, ArrowRight } from "lucide-react"

const metrics = [
  { icon: Flame, value: "3.5%", label: "Buy and burn" },
  { icon: Sprout, value: "1.5%", label: "Reflections to holders" },
  { icon: Vault, value: "1%", label: "Added to Smaug's Vault" },
  { icon: Droplet, value: "0.5%", label: "Added to burned LP" },
]

const SMAUG_TOTAL_SUPPLY = 1_000_000_000

export function Tokenomics() {
  const [smaugBurned, setSmaugBurned] = useState<number | null>(null)
  const [burnedPlsAdded, setBurnedPlsAdded] = useState<number | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsRes = await fetch("/api/stats")
        if (statsRes.ok) {
          const stats = await statsRes.json()
          setSmaugBurned(stats.smaugBurned ?? null)
          setBurnedPlsAdded(stats.smaugLpPls ?? null)
        }
      } catch (err) {
        console.log("[v0] Failed to fetch tokenomics data")
      }
    }
    fetchData()
  }, [])

  const formatNumber = (n: number | null) => {
    if (n === null) return "—"
    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + "B"
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
    if (n >= 1_000) return (n / 1_000).toFixed(1) + "K"
    return n.toLocaleString(undefined, { maximumFractionDigits: 0 })
  }

  const formatBurnedPct = (n: number | null) =>
    n === null ? "—" : ((n / SMAUG_TOTAL_SUPPLY) * 100).toFixed(2) + "%"

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <div className="overflow-hidden rounded-2xl border border-[#2a2a35] bg-[#101017]">
        <div className="grid items-center gap-6 md:grid-cols-[1fr_1.4fr]">
          {/* Art */}
          <div className="relative h-48 w-full md:h-full md:min-h-65">
            <Image src="/landing/hoard.png" alt="Dragon guarding its hoard of gold" fill className="object-cover" />
            <div className="absolute inset-0 bg-linear-to-r from-transparent to-[#101017] md:bg-linear-to-r" />
          </div>

          {/* Content */}
          <div className="px-7 pb-8 pt-2 md:py-8 md:pr-10">
            <h2 className="font-serif text-2xl font-bold text-[#B87333]">Tokenomics of Smaug</h2>

            <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-4">
              {metrics.map((m) => (
                <div key={m.label} className="flex flex-col items-start">
                  <div className="flex items-baseline gap-2">
                    <m.icon className="h-5 w-5 text-[#B87333]" />
                    <span className="font-serif text-2xl font-bold text-[#e8e6e3]">{m.value}</span>
                  </div>
                  <span className="mt-1 font-sans text-xs text-[#9ca3af]">{m.label}</span>
                </div>
              ))}
            </div>

            {/* Live on-chain figures */}
            <div className="mt-6 border-t border-[#2a2a35] pt-4">
              <p className="font-sans text-sm text-[#b8b6b1]">
                <span className="font-semibold">{formatBurnedPct(smaugBurned)}</span>
                <span> burned</span>
                <span className="mx-2 text-[#7c7a76]">—</span>
                <span className="font-semibold">{formatNumber(burnedPlsAdded)}</span>
                <span> PLS added to burned liquidity</span>
              </p>
            </div>

            <a
              href="#tokens"
              className="mt-4 inline-flex items-center gap-1.5 font-sans text-sm font-medium text-[#B87333] hover:underline"
            >
              View full tokenomics <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}