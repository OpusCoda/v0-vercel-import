import { SiteNav } from "@/components/landing/site-nav"
import { Tokens } from "@/components/landing/tokens"
import { TokenOverview } from "@/components/landing/token-overview"
import { BuyTokens } from "@/components/landing/buy-tokens"
import { SiteFooter } from "@/components/landing/site-footer"
import { Play } from "lucide-react"

export default function TokensPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0c]">
      <SiteNav />

      <div className="mx-auto max-w-7xl px-4 pt-14 md:px-6">
        <h1 className="text-balance font-serif text-4xl font-bold text-[#e8e6e3] md:text-5xl">
          Three tokens. One ecosystem.
        </h1>

        <p className="mt-4 max-w-2xl text-pretty font-sans text-base leading-relaxed text-[#b8b6b1]">
          Opus distributes PLS. Coda distributes PLSX. Smaug reduces supply while
          rewarding stakers.
        </p>

        <a
          href="https://www.youtube.com/watch?v=Qr-avVraIA0"
          target="_blank"
          rel="noopener noreferrer"
          className="group mt-5 inline-flex items-center gap-2 font-sans text-sm font-medium text-[#B87333] transition-colors hover:text-[#e8e6e3]"
        >
          <Play className="h-4 w-4 fill-current" />
          <span>What are Opus and Coda? Watch the 2-minute explainer</span>
        </a>
      </div>

      <Tokens />
      <TokenOverview />
      <BuyTokens />
      <SiteFooter />
    </main>
  )
}