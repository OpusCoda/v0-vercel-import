import Image from "next/image"
import { ShieldCheck } from "lucide-react"

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-[#2a2a35]">
      {/* Dragon backdrop */}
      <div className="absolute inset-0">
        <Image
          src="/landing/hero-dragon.png"
          alt=""
          fill
          priority
          className="object-cover object-right opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0c] via-[#0a0a0c]/85 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-transparent to-transparent" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-28 lg:py-32">
        <div className="max-w-2xl">
          <h1 className="text-balance font-serif text-4xl font-bold leading-tight text-[#e8e6e3] md:text-5xl lg:text-6xl">
            Earn from PulseChain by <span className="text-[#d4af37]">holding, staking, and predicting.</span>
          </h1>
          <p className="mt-6 max-w-md text-pretty font-sans text-base leading-relaxed text-[#b8b6b1] md:text-lg">
            The OpusEco ecosystem rewards participation across staking, prediction markets, and community wagers.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              type="button"
              className="rounded-md bg-[#d4af37] px-8 py-3.5 font-sans text-sm font-semibold text-[#0a0a0c] transition-colors hover:bg-[#c19b2e]"
            >
              Connect Wallet
            </button>
          </div>

          <p className="mt-6 flex items-center gap-2 font-sans text-sm text-[#9ca3af]">
            <ShieldCheck className="h-4 w-4 text-[#d4af37]" />
            Secure. Non-custodial. Your keys, your assets.
          </p>
        </div>
      </div>
    </section>
  )
}
