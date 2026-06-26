import Image from "next/image"
import { ArrowRight } from "lucide-react"

const buys = [
  { name: "Buy Opus", img: "/opus-circle.png", accent: "#d4af37", href: "#" },
  { name: "Buy Coda", img: "/coda-circle.png", accent: "#c0c4cc", href: "#" },
  { name: "Buy Smaug", img: "/smaug-circle.png", accent: "#cd7f32", href: "#" },
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
    </section>
  )
}
