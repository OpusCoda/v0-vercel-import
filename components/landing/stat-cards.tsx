"use client"

import { useEffect, useState } from "react"
import { Coins, Flame, Droplets, Gift } from "lucide-react"
import { formatBillions } from "@/lib/onchain"

export function StatCards() {
  const [plsDistributed, setPlsDistributed] = useState<number | null>(null)
  const [plsxDistributed, setPlsxDistributed] = useState<number | null>(null)
  const [smaugBurned, setSmaugBurned] = useState<number | null>(null)
  const [plsPrice, setPlsPrice] = useState<number | null>(null)
  const [plsxPrice, setPlsxPrice] = useState<number | null>(null)
  const [otherTokensUsd, setOtherTokensUsd] = useState<number | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      // Cached on-chain stats + prices — both served from fast, shared server caches
      try {
        const [statsRes, pricesRes] = await Promise.all([fetch("/api/stats"), fetch("/api/prices")])

        if (statsRes.ok) {
          const stats = await statsRes.json()
          setPlsDistributed(stats.plsDistributed ?? null)
          setPlsxDistributed(stats.plsxDistributed ?? null)
          setSmaugBurned(stats.smaugBurned ?? null)
        }

        if (pricesRes.ok) {
          const prices = await pricesRes.json()
          setPlsPrice(prices.pls ?? null)
          setPlsxPrice(prices.plsx ?? null)

          // Distributed "other" reward tokens (amounts distributed to holders)
          const DISTRIBUTED_MISSOR = 29_680_000
          const DISTRIBUTED_FINVESTA = 19_578
          const DISTRIBUTED_WGPP = 13_351
          const otherUsd =
            DISTRIBUTED_MISSOR * (prices.missor ?? 0) +
            DISTRIBUTED_FINVESTA * (prices.finvesta ?? 0) +
            DISTRIBUTED_WGPP * (prices.wgpp ?? 0)
          setOtherTokensUsd(otherUsd)
        }
      } catch (err) {
        console.error("[v0] Error fetching stats:", err)
      }
    }
    fetchData()
  }, [])

  const display = (v: number | null) => (v === null ? "—" : formatBillions(v))
  const fmtUsd = (v: number | null) =>
    v === null ? null : `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
  const usd = (amount: number | null, price: number | null) =>
    amount === null || price === null ? null : fmtUsd(amount * price)

  const stats = [
    { label: "TOTAL PLS DISTRIBUTED", value: display(plsDistributed), unit: "PLS", usd: usd(plsDistributed, plsPrice), icon: <Coins className="h-8 w-8 text-[#d4af37]" /> },
    { label: "TOTAL PLSX DISTRIBUTED", value: display(plsxDistributed), unit: "PLSX", usd: usd(plsxDistributed, plsxPrice), icon: <Droplets className="h-8 w-8 text-[#d4af37]" /> },
    { label: "OTHER TOKENS", value: fmtUsd(otherTokensUsd) ?? "—", unit: "", usd: null, sub: "", icon: <Gift className="h-8 w-8 text-[#d4af37]" /> },
    { label: "SMAUG BURNED", value: display(smaugBurned), unit: "SMAUG", usd: null, icon: <Flame className="h-8 w-8 text-[#d4af37]" /> },
  ]

  // Total distributed to holders (USD): PLS + PLSX + other reward tokens
  const totalDistributedUsd =
    plsDistributed !== null && plsPrice !== null && plsxDistributed !== null && plsxPrice !== null && otherTokensUsd !== null
      ? plsDistributed * plsPrice + plsxDistributed * plsxPrice + otherTokensUsd
      : null

  return (
    <section className="relative z-10 mx-auto -mt-10 max-w-7xl px-4 md:px-6">
      <p className="mb-4 text-center font-serif text-2xl font-bold text-[#e8e6e3] md:text-3xl">
        {fmtUsd(totalDistributedUsd) ?? "—"}{" "}
        <span className="font-sans text-base font-normal text-[#9ca3af]">total distributed to holders</span>
      </p>
      <div className="grid gap-px overflow-hidden rounded-2xl border border-[#2a2a35] bg-[#2a2a35] sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-4 bg-[#0d0d12] px-6 py-7">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center">{stat.icon}</span>
            <span className="flex flex-col">
              <span className="font-sans text-[11px] tracking-[0.12em] text-[#9ca3af]">{stat.label}</span>
              <span className="mt-1 font-serif text-2xl font-bold text-[#e8e6e3]">
                {stat.value} {stat.unit && <span className="text-sm font-normal text-[#9ca3af]">{stat.unit}</span>}
              </span>
              {stat.usd && <span className="mt-0.5 font-sans text-sm text-[#d4af37]">{stat.usd}</span>}
              {stat.sub && <span className="mt-0.5 font-sans text-xs text-[#9ca3af]">{stat.sub}</span>}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
