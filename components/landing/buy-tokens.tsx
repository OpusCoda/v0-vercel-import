"use client"

import { useState } from "react"
import Image from "next/image"
import { ArrowRight, ExternalLink, Copy, Check } from "lucide-react"

const buys = [
  { name: "Buy Opus", img: "/opus-circle.png", accent: "#d4af37", href: "#" },
  { name: "Buy Coda", img: "/coda-circle.png", accent: "#c0c4cc", href: "#" },
  { name: "Buy Smaug", img: "/smaug-circle.png", accent: "#cd7f32", href: "#" },
]

const contracts = [
  {
    name: "Opus",
    address: "0x9B5a65E37f338ADD1263530DDac8CEc56204bB3a",
    url: "https://otter.pulsechain.com/address/0x9B5a65E37f338ADD1263530DDac8CEc56204bB3a",
  },
  {
    name: "Coda",
    address: "0x9F8d74dF6DD3145e858578B0bE1d9B11f41E0A28",
    url: "https://otter.pulsechain.com/address/0x9F8d74dF6DD3145e858578B0bE1d9B11f41E0A28",
  },
  {
    name: "Smaug",
    address: "0xf4754Aa585caBf38537A68660469A17E203D8632",
    url: "https://otter.pulsechain.com/address/0xf4754Aa585caBf38537A68660469A17E203D8632",
  },
]

export function BuyTokens() {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopy = (address: string, contractName: string) => {
    navigator.clipboard.writeText(address)
    setCopiedId(contractName)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 md:px-6">
      <h2 className="text-center font-serif text-xl font-bold text-[#e8e6e3]">Buy Tokens</h2>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {buys.map((b) => (
          <a
            key={b.name}
            href={b.href}
            className="group flex items-center justify-between rounded-2xl border border-[#2a2a35] bg-[#101017] px-6 py-5 transition-colors hover:border-[#d4af37]/50"
          >
            <span className="flex items-center gap-4">
              <Image src={b.img || "/placeholder.svg"} alt="" width={44} height={44} className="rounded-full" />
              <span className="flex flex-col">
                <span className="font-serif text-lg font-bold" style={{ color: b.accent }}>
                  {b.name}
                </span>
                <span className="font-sans text-xs text-[#9ca3af]">On PulseX</span>
              </span>
            </span>
            <ArrowRight className="h-5 w-5 text-[#9ca3af] transition-transform group-hover:translate-x-1 group-hover:text-[#d4af37]" />
          </a>
        ))}
      </div>

      {/* Contract Addresses Section */}
      <div className="mt-12">
        <h3 className="font-serif text-xl font-bold text-[#e8e6e3] mb-4">Contract Addresses</h3>
        <div className="space-y-2 rounded-2xl border border-[#2a2a35] bg-[#101017] p-6">
          {contracts.map((contract) => (
            <div key={contract.name} className="flex items-center gap-3 group hover:bg-[#0d0d12] px-3 py-2 rounded-lg transition-colors">
              <button
                onClick={() => handleCopy(contract.address, contract.name)}
                className="shrink-0 p-1.5 text-[#9ca3af] hover:text-[#d4af37] transition-colors"
                title="Copy address"
              >
                {copiedId === contract.name ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
              <a
                href={contract.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 flex-1 min-w-0"
              >
                <span className="font-mono text-sm text-[#d4af37]">{contract.name}:</span>
                <span className="font-mono text-sm text-[#b8b6b1] truncate hover:text-[#e8e6e3]">{contract.address}</span>
                <ExternalLink className="h-4 w-4 text-[#9ca3af] shrink-0 group-hover:text-[#d4af37] transition-colors" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
