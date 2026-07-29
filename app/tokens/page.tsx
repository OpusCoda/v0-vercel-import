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

        {/* Video Explainer */}
        <a
          href="https://www.youtube.com/watch?v=Qr-avVraIA0"
          target="_blank"
          rel="noopener noreferrer"
          className="group mt-8 flex max-w-2xl items-center justify-between rounded-2xl border border-[#2a2a35] bg-[#101017] px-6 py-5 transition-colors hover:border-[#d4af37]/50"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d4af37]/10 text-[#d4af37]">
            <Play className="ml-0.5 h-4 w-4 fill-current" />
            </div>

            <div>
              <h2 className="font-serif text-xl font-bold text-[#e8e6e3]">
                What are the Opus and Coda reward tokens?
              </h2>

              <p className="mt-1 font-sans text-sm text-[#b8b6b1]">
                Watch the 2-minute explainer on YouTube
              </p>
            </div>
          </div>

        </a>
      </div>

      <Tokens />
      <TokenOverview />
      <BuyTokens />
      <SiteFooter />
    </main>
  )
}