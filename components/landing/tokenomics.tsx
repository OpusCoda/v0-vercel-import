import Image from "next/image"
import { Flame, Sprout, Package, ArrowRight } from "lucide-react"

const metrics = [
  { icon: Flame, value: "1%", label: "Buy Tax" },
  { icon: Sprout, value: "1%", label: "Sell Tax" },
  { icon: Package, value: "50%", label: "Staking Rewards" },
  { icon: Package, value: "50%", label: "Burned Permanently" },
]

export function Tokenomics() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <div className="overflow-hidden rounded-2xl border border-[#2a2a35] bg-[#101017]">
        <div className="grid items-center gap-6 md:grid-cols-[1fr_1.4fr]">
          {/* Art */}
          <div className="relative h-48 w-full md:h-full md:min-h-[260px]">
            <Image src="/landing/hoard.png" alt="Dragon guarding its hoard of gold" fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#101017] md:bg-gradient-to-r" />
          </div>

          {/* Content */}
          <div className="px-7 pb-8 pt-2 md:py-8 md:pr-10">
            <h2 className="font-serif text-2xl font-bold text-[#d4af37]">Smaug Tokenomics</h2>

            <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-4">
              {metrics.map((m) => (
                <div key={m.label} className="flex flex-col items-start">
                  <div className="flex items-baseline gap-2">
                    <m.icon className="h-5 w-5 text-[#d4af37]" />
                    <span className="font-serif text-2xl font-bold text-[#e8e6e3]">{m.value}</span>
                  </div>
                  <span className="mt-1 font-sans text-xs text-[#9ca3af]">{m.label}</span>
                </div>
              ))}
            </div>

            <p className="mt-6 max-w-lg font-sans text-sm leading-relaxed text-[#b8b6b1]">
              Every transaction strengthens the hoard. Every stake earns from the ecosystem.
            </p>
            <a
              href="#tokens"
              className="mt-3 inline-flex items-center gap-1.5 font-sans text-sm font-medium text-[#d4af37] hover:underline"
            >
              View full tokenomics <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
