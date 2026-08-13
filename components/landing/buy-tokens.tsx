"use client"

import { useState } from "react"
import Image from "next/image"
import { Copy, Check } from "lucide-react"

function OrnamentHeading({
  children,
  as: Tag = "h2",
}: {
  children: React.ReactNode
  as?: "h1" | "h2" | "h3"
}) {
  return (
    <Tag className="flex items-center gap-3 font-serif text-xl font-bold text-[#b1cbdc]">
      <span className="text-[#B87333]">◆—</span>
      {children}
      <span className="text-[#B87333]">—◆</span>
    </Tag>
  )
}

const buys = [
  {
    name: "Buy Opus",
    img: "/opus-circle.png",
    accent: "#b1cbdc",
    href: "#",
  },
  {
    name: "Buy Coda",
    img: "/coda-circle.png",
    accent: "#b1cbdc",
    href: "#",
  },
  {
    name: "Buy Smaug",
    img: "/smaug-circle.png",
    accent: "#b1cbdc",
    href: "#",
  },
]

// Token contracts.
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

// Protocol contracts (staking + the two markets).
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
    <div className="flex items-center justify-between gap-3 px-6 py-3">
      <div className="min-w-0">
        <span className="font-medium text-white">{contract.name}:</span>
        <span className="ml-2 break-all font-mono text-sm text-[#9ca3af]">
          {contract.address}
        </span>
      </div>

      <button
        onClick={() => onCopy(contract.address, contract.name)}
        className="shrink-0 p-1.5 text-[#9ca3af] transition-colors hover:text-[#B87333]"
        title="Copy address"
        type="button"
      >
        {copiedId === contract.name ? (
          <Check className="h-4 w-4" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </button>
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
    <section>
      <div className="space-y-8">
        {/* Where to buy */}
        <div>
          <OrnamentHeading>Where to buy</OrnamentHeading>

          <div className="mt-4 grid gap-3">
            {buys.map((b) => (
              <a
                key={b.name}
                href={b.href}
                className="flex items-center gap-3"
              >
                <Image
                  src={b.img}
                  alt={b.name}
                  width={40}
                  height={40}
                />

                <div>
                  <span
                    className="font-serif text-lg font-bold"
                    style={{ color: b.accent }}
                  >
                    {b.name}
                  </span>

                  <div className="text-sm text-[#9ca3af]">On PulseX</div>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Contract addresses */}
        <div>
          <OrnamentHeading>Contract addresses</OrnamentHeading>

          {/* Tokens */}
          <div className="mb-2 mt-4 px-6 text-sm font-semibold uppercase tracking-wider text-[#9ca3af]">
            Tokens
          </div>

          {/* Token contracts */}
          <div>
            {contracts.map((contract) => (
              <AddressRow
                key={contract.name}
                contract={contract}
                copiedId={copiedId}
                onCopy={handleCopy}
              />
            ))}
          </div>

          {/* Divider */}
          <div className="my-4 border-t border-[#24242c]" />

          {/* Protocol */}
          <div className="mb-2 px-6 text-sm font-semibold uppercase tracking-wider text-[#9ca3af]">
            Protocol
          </div>

          {/* Protocol contracts */}
          <div>
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
      </div>
    </section>
  )
}