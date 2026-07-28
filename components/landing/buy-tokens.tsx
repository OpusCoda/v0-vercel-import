import Image from "next/image"
import { ArrowRight, ExternalLink } from "lucide-react"

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

      {/* Contract Addresses */}
      <div className="mt-12 rounded-2xl border border-[#2a2a35] bg-[#101017] p-6">
        <h3 className="font-serif text-lg font-bold text-[#e8e6e3] mb-4">Contract Addresses</h3>
        <div className="grid gap-3 md:grid-cols-3">
          {contracts.map((contract) => (
            <a
              key={contract.name}
              href={contract.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start justify-between rounded-lg border border-[#2a2a35] bg-[#0d0d12] px-4 py-3 transition-colors hover:border-[#d4af37]/50"
            >
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[#d4af37] text-sm">{contract.name}</div>
                <div className="font-mono text-xs text-[#7c7a76] mt-1 truncate hover:break-all">{contract.address}</div>
              </div>
              <ExternalLink className="h-4 w-4 text-[#9ca3af] shrink-0 ml-2 group-hover:text-[#d4af37] transition-colors" />
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
