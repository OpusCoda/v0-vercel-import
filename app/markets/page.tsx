import { SiteNav } from "@/components/landing/site-nav"
import { SiteFooter } from "@/components/landing/site-footer"
import { MarketsOverview } from "@/components/landing/markets-overview"
import { MarketsList } from "@/components/landing/markets-list"

export default function MarketsPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0c]">
      <SiteNav />
      <div className="pt-24 md:pt-28">
        <MarketsList />
        <MarketsOverview />
      </div>
      <SiteFooter />
    </main>
  )
}
