"use client"

import { useState } from "react"
import { Copy, Check, ExternalLink } from "lucide-react"

const contracts = [
  { name: "Opus", address: "0x9B5a65E37f338ADD1263530DDac8CEc56204bB3a" },
  { name: "Coda", address: "0x9F8d74dF6DD3145e858578B0bE1d9B11f41E0A28" },
  { name: "Smaug", address: "0xf4754Aa585caBf38537A68660469A17E203D8632" },
]

const short = (a: string) => `${a.slice(0, 6)}...${a.slice(-4)}`

export function Contracts() {
  const [copied, setCopied] = useState<string | null>(null)

  const copy = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address)
      setCopied(address)
      setTimeout(() => setCopied(null), 1500)
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <div className="flex flex-col gap-5 rounded-2xl border border-[#2a2a35] bg-[#101017] px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
        <span className="font-sans text-sm font-medium text-[#9ca3af]">Contract Addresses</span>

        <div className="flex flex-wrap gap-x-10 gap-y-4">
          {contracts.map((c) => (
            <div key={c.name} className="flex flex-col">
              <span className="font-sans text-xs text-[#9ca3af]">{c.name}</span>
              <button
                type="button"
                onClick={() => copy(c.address)}
                className="flex items-center gap-2 font-mono text-sm text-[#e8e6e3] transition-colors hover:text-[#d4af37]"
              >
                {short(c.address)}
                {copied === c.address ? (
                  <Check className="h-3.5 w-3.5 text-[#5fbf7f]" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-[#9ca3af]" />
                )}
              </button>
            </div>
          ))}
        </div>

        <a
          href="https://scan.pulsechain.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 font-sans text-sm text-[#d4af37] hover:underline"
        >
          View on PulseScan <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </section>
  )
}
