"use client"

import { useState } from "react"
import Image from "next/image"
import { ArrowRight, ExternalLink, Copy, Check } from "lucide-react"

function OrnamentHeading({
  children,
  as: Tag = "h2",
}: {
  children: React.ReactNode
  as?: "h1" | "h2" | "h3"
}) {
  return (
    <div className="flex items-center justify-center gap-4">
      <span className="text-[#B87333]/50">&#9670;&mdash;</span>
      <Tag className="text-center font-serif text-xl font-bold text-[#B87333] md:text-2xl">
        {children}
      </Tag>
      <span className="text-[#B87333]/50">&mdash;&#9670;</span>
    </div>
  )
}

const buys = [
  { name: "Buy Opus", img: "/opus-circle.png", accent: "#b1cbdc", href: "#" },
  { name: "Buy Coda", img: "/coda-circle.png", accent: "#b1cbdc", href: "#" },
  { name: "Buy Smaug", img: "/smaug-circle.png", accent: "#b1cbdc", href: "#" },
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

const protocolContracts = [
  {
    name: "Smaug Staking",
    address: "0x8Fa4a2f0E465d63C287d4147638d5514bDE2f38D",
    url: "https://otter.pulsechain.com/address/0x8Fa4a2f0E465d63C287d4147638d5514bDE2f38D",
  },
  {
    name: "Probability Shop",
    address: "0xBeE9e50cF2b522D225b2B2115C0c0F2ce2aFE392",
    url: "https://otter.pulsechain.com/address/0xBeE9e50cF2b522D225b2B2115C0c0F2ce2aFE392",
  },
  {
    name: "Outcome Exchange",
    address: "0x6FaE169714ba3BE839332785291f798d627BCE8c",
    url: "https://otter.pulsechain.com/address/0x6FaE169714ba3BE839332785291f798d627BCE8c",
  },
]

function AddressRow({
  contract,
  copiedId,
  onCopy,
}: {
  contract: { name: string; address: string; url: string }
  copiedId: string | null
  onCopy: (address: string, name: string) => void
}) {
  return (
    <div className="group flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-[#0d0d12]">
      <button
        onClick={() => onCopy(contract.address, contract.name)}
        className="shrink-0 p-1.5 text-[#9ca3af] transition-colors hover:text-[#B87333]"
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
        className="flex min-w-0 flex-1 items-center gap-2"
      >
        <span className="shrink-0 font-mono text-sm text-[#B87333]">{contract.name}:</span>
        <span className="truncate font-mono text-sm text-[#b8b6b1] hover:text-[#e8e6e3]">
          {contract.address}
        </span>
        <ExternalLink className="h-4 w-4 shrink-0 text-[#9ca3af] transition-colors group-hover:text-[#B87333]" />
      </a>
    </div>
  )
}

export function BuyTokens() {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopy = (address: string, contractName: string) => {
    navigator.clipboard.writeText(address)
    setCopiedId(contractName)
    setTimeout(() => setCopiedId(null), 5000)
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 md:px-6">
      <OrnamentHeading>Where to buy</OrnamentHeading>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {buys.map((b) => (
          <a
            key={b.name}
            href={b.href}
            className="group flex items-center justify-between rounded-2xl border border-[#2a2a35] bg-[#101017] px-6 py-5 transition-colors hover:border-[#B87333]/50"
          >
            <span className="flex items-center gap-4">
              <Image src={b.img} alt="" width={44} height={44} className="rounded-full" />
              <span className="flex flex-col">
                <span className="font-serif text-lg font-bold" style={{ color: b.accent }}>
                  {b.name}
                </span>
                <span className="font-sans text-xs text-[#9ca3af]">On PulseX</span>
              </span>
            </span>
            <ArrowRight className="h-5 w-5 text-[#9ca3af] transition-transform group-hover:translate-x-1 group-hover:text-[#B87333]" />
          </a>
        ))}
      </div>

      <div className="mt-16">
        <OrnamentHeading as="h3">Contract addresses</OrnamentHeading>

        <div className="mt-6 space-y-2 rounded-2xl border border-[#2a2a35] bg-[#101017] p-6">
          <div className="mb-3 flex items-center gap-3 px-3">
            <div className="h-px flex-1 bg-[#2a2a35]" />
            <span className="font-sans text-[10px] uppercase tracking-wider text-[#7c7a76]">
              Tokens
            </span>
            <div className="h-px flex-1 bg-[#2a2a35]" />
          </div>

          {contracts.map((contract) => (
            <AddressRow
              key={contract.name}
              contract={contract}
              copiedId={copiedId}
              onCopy={handleCopy}
            />
          ))}

          <div className="my-3 flex items-center gap-3 px-3">
            <div className="h-px flex-1 bg-[#2a2a35]" />
            <span className="font-sans text-[10px] uppercase tracking-wider text-[#7c7a76]">
              Protocol
            </span>
            <div className="h-px flex-1 bg-[#2a2a35]" />
          </div>

          {protocolContracts.map((contract) => (
            <AddressRow
              key={contract.name}
              contract={contract}
              copiedId={copiedId}
              onCopy={handleCopy}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
