import { SiteNav } from "@/components/landing/site-nav"
import { SiteFooter } from "@/components/landing/site-footer"
import { MarketsOverview } from "@/components/landing/markets-overview"
import { MarketsList } from "@/components/landing/markets-list"
import { WagerMarketStats } from "@/components/markets/wager-market-stats"
import { OpenWagers } from "@/components/markets/open-wagers"
import { CreateWager } from "@/components/markets/create-wager"

export default function MarketsPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0c]">
      <SiteNav />
      <div className="pt-24 md:pt-28 px-6 max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="font-serif text-4xl font-bold mb-2">P2P Wager Market</h1>
          <p className="text-[#9a9a9a]">Create wagers, view market stats, and explore open opportunities</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="md:col-span-2">
            <CreateWager />
          </div>
          <div>
            <WagerMarketStats />
          </div>
        </div>
        
        <OpenWagers />
        
        <div className="mt-16">
          <MarketsList />
          <MarketsOverview />
        </div>
      </div>
      <SiteFooter />
    </main>
  )
}
