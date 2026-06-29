import { SiteNav } from "@/components/landing/site-nav"
import { Hero } from "@/components/landing/hero"
import { StatCards } from "@/components/landing/stat-cards"
import { Participate } from "@/components/landing/participate"
import { LiveFeed } from "@/components/landing/live-feed"
import { Tokenomics } from "@/components/landing/tokenomics"
import { BuyTokens } from "@/components/landing/buy-tokens"
import { Contracts } from "@/components/landing/contracts"
import { SiteFooter } from "@/components/landing/site-footer"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0a0a0c]">
      <SiteNav />
      <Hero />
      <StatCards />
      <Participate />
      <LiveFeed />
      <Tokenomics />
      <BuyTokens />
      <Contracts />
      <SiteFooter />
    </main>
  )
}
