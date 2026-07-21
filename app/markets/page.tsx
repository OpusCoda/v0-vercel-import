import Image from "next/image"
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
      
      {/* Hero Section with Dragon Background */}
      <section className="relative overflow-hidden border-b border-[#2a2a35]">
        {/* Dragon backdrop */}
        <div className="absolute inset-0">
          <Image
            src="/landing/hero-dragon.png"
            alt=""
            fill
            priority
            className="object-cover object-right opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0c] via-[#0a0a0c]/90 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-transparent to-transparent" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 py-16 md:py-20">
          <div className="max-w-2xl">
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-[#e8e6e3] mb-3">
              Opus Markets
            </h1>
            <p className="text-lg text-[#b8b6b1] max-w-md">
              Create and accept peer-to-peer wagers on real-world outcomes.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6">
        {/* Stats Row */}
        <div className="py-12">
          <WagerMarketStats />
        </div>

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-3 gap-8 py-8">
          {/* Left Column - Create Wager */}
          <div className="md:col-span-2">
            <CreateWager />
          </div>
          
          {/* Right Column - Open Wagers */}
          <div>
            <OpenWagers />
          </div>
        </div>

        {/* Market Browse Section */}
        <div className="py-12 border-t border-[#2a2a35]">
          <div className="mb-8">
            <h2 className="font-serif text-2xl font-bold text-[#e8e6e3] mb-1">Market Explore</h2>
            <p className="text-sm text-[#9a9a9a]">Browse featured predictions and market categories</p>
          </div>
          <MarketsList />
          <MarketsOverview />
        </div>
      </div>

      <SiteFooter />
    </main>
  )
}
