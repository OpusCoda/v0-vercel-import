import { SiteNav } from "@/components/landing/site-nav"
import { Tokens } from "@/components/landing/tokens"
import { BuyTokens } from "@/components/landing/buy-tokens"
import { Contracts } from "@/components/landing/contracts"
import { SiteFooter } from "@/components/landing/site-footer"

export default function TokensPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0c]">
      <SiteNav />
      <div className="mx-auto max-w-7xl px-4 pt-14 md:px-6">
        <h1 className="text-balance font-serif text-4xl font-bold text-[#e8e6e3] md:text-5xl">
          The <span className="text-[#d4af37]">Tokens</span>
        </h1>
        <p className="mt-4 max-w-xl text-pretty font-sans text-base leading-relaxed text-[#b8b6b1]">
          Three tokens power the OpusEco ecosystem. Hold, stake, and earn reflections across PulseChain.
        </p>
      </div>
      <Tokens />
      <BuyTokens />
      <Contracts />
      <SiteFooter />
    </main>
  )
}
