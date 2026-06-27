"use client"

import { useEffect, useState } from "react"
import { ethers } from "ethers"
import { Coins, Flame, Droplets } from "lucide-react"
import {
  OPUS_CONTRACT,
  CODA_CONTRACT,
  CODA_DISTRIBUTORS,
  SMAUG_ADDRESS,
  FINVESTA_ADDRESS,
  MISSOR_ADDRESS,
  WGPP_ADDRESS,
  OPUS_ABI,
  DISTRIBUTOR_ABI,
  SMAUG_ABI,
  BURN_ADDRESS,
  getProvider,
  rpcRetry,
  formatBillions,
} from "@/lib/onchain"

export function StatCards() {
  const [plsDistributed, setPlsDistributed] = useState<number | null>(null)
  const [plsxDistributed, setPlsxDistributed] = useState<number | null>(null)
  const [smaugBurned, setSmaugBurned] = useState<number | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      const provider = getProvider()

      // Total PLS distributed (Opus) + printer PLS (Finvesta/Missor/WGPP)
      try {
        const opus = new ethers.Contract(OPUS_CONTRACT, OPUS_ABI, provider)
        const plsVal = await rpcRetry(() => opus.getTotalPlsDistributed(), 1, 2000)
        let totalPls = Number(ethers.formatUnits(plsVal, 18))

        const scale = BigInt("10000000000000000000000")
        const fmtPrinter = (raw: bigint) => {
          const whole = raw / scale
          const frac = (raw % scale).toString().padStart(22, "0")
          return Number.parseFloat(`${whole}.${frac}`)
        }
        const [finvesta, missor, wgpp] = await Promise.all([
          rpcRetry(() => opus.getTotalPlsEarned(FINVESTA_ADDRESS), 1, 2000),
          rpcRetry(() => opus.getTotalPlsEarned(MISSOR_ADDRESS), 1, 2000),
          rpcRetry(() => opus.getTotalPlsEarned(WGPP_ADDRESS), 1, 2000),
        ])
        totalPls += fmtPrinter(BigInt(finvesta.toString())) + fmtPrinter(BigInt(missor.toString())) + fmtPrinter(BigInt(wgpp.toString()))
        setPlsDistributed(totalPls)
      } catch (err) {
        console.error("[v0] Error fetching PLS distributed:", err)
      }

      // Total PLSX distributed (Coda distributors + new Coda contract selector)
      try {
        let totalPlsx = 0n
        const results = await Promise.allSettled(
          CODA_DISTRIBUTORS.map((address) => {
            const contract = new ethers.Contract(address, DISTRIBUTOR_ABI, provider)
            return rpcRetry(() => contract.totalPlsxDistributed(), 1, 2000).then((v) => BigInt(v))
          }),
        )
        for (const r of results) if (r.status === "fulfilled") totalPlsx += r.value

        try {
          const newCodaPlsx = await rpcRetry(() => provider.call({ to: CODA_CONTRACT, data: "0x775b2dfa" }), 1, 2000)
          if (newCodaPlsx && newCodaPlsx !== "0x") totalPlsx += BigInt(newCodaPlsx)
        } catch (e) {
          console.error("[v0] Error fetching new Coda PLSX:", e)
        }
        setPlsxDistributed(Number(ethers.formatUnits(totalPlsx, 18)))
      } catch (err) {
        console.error("[v0] Error fetching PLSX distributed:", err)
      }

      // Smaug burned
      try {
        const smaug = new ethers.Contract(SMAUG_ADDRESS, SMAUG_ABI, provider)
        let burned
        try {
          burned = await rpcRetry(() => smaug.totalBurned())
        } catch {
          burned = await rpcRetry(() => smaug.balanceOf(BURN_ADDRESS))
        }
        setSmaugBurned(Number(ethers.formatEther(burned)))
      } catch (err) {
        console.error("[v0] Error fetching Smaug burned:", err)
      }
    }
    fetchStats()
  }, [])

  const display = (v: number | null) => (v === null ? "—" : formatBillions(v))

  const stats = [
    { label: "TOTAL PLS DISTRIBUTED", value: display(plsDistributed), unit: "PLS", icon: <Coins className="h-8 w-8 text-[#d4af37]" /> },
    { label: "TOTAL PLSX DISTRIBUTED", value: display(plsxDistributed), unit: "PLSX", icon: <Droplets className="h-8 w-8 text-[#d4af37]" /> },
    { label: "SMAUG BURNED", value: display(smaugBurned), unit: "SMAUG", icon: <Flame className="h-8 w-8 text-[#d4af37]" /> },
  ]

  return (
    <section className="relative z-10 mx-auto -mt-10 max-w-7xl px-4 md:px-6">
      <div className="grid gap-px overflow-hidden rounded-2xl border border-[#2a2a35] bg-[#2a2a35] md:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-4 bg-[#0d0d12] px-6 py-7">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center">{stat.icon}</span>
            <span className="flex flex-col">
              <span className="font-sans text-[11px] tracking-[0.12em] text-[#9ca3af]">{stat.label}</span>
              <span className="mt-1 font-serif text-2xl font-bold text-[#e8e6e3]">
                {stat.value} <span className="text-sm font-normal text-[#9ca3af]">{stat.unit}</span>
              </span>
            </span>
          </div>
        ))}
      </div>
      <p className="mt-4 text-center font-sans text-xs text-[#7c7a76]">Live on-chain data from PulseChain</p>
    </section>
  )
}
