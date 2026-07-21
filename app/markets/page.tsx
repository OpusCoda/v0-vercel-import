'use client'
import { useState } from 'react'
import Image from "next/image"
import { SiteNav } from "@/components/landing/site-nav"
import { SiteFooter } from "@/components/landing/site-footer"
import { MarketsList } from "@/components/landing/markets-list"
import { WagerMarketStats } from "@/components/markets/wager-market-stats"
import { OpenWagers } from "@/components/markets/open-wagers"
import { CreateWager } from "@/components/markets/create-wager"

type Mode = 'p2p' | 'probability'

export default function MarketsPage() {
  const [mode, setMode] = useState<Mode>('p2p')
  const [showCreateForm, setShowCreateForm] = useState(false)

  return (
    <main className="min-h-screen bg-[#0a0a0c]">
      <SiteNav />
      
      {/* Compact Hero with Primary Actions */}
      <section className="relative overflow-hidden border-b border-[#2a2a35]">
        <div className="absolute inset-0 opacity-10">
          <Image
            src="/landing/hero-dragon.png"
            alt=""
            fill
            priority
            className="object-cover object-right"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0c] to-transparent" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl font-bold text-[#e8e6e3] mb-1">
                Markets
              </h1>
              <p className="text-sm text-[#9a9a9a]">
                Create P2P wagers or browse prediction markets using PLS.
              </p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <button
                onClick={() => {
                  setMode('p2p')
                  setShowCreateForm(true)
                }}
                className="inline-flex items-center px-4 py-2 bg-[#d8b13d] text-[#0a0a0c] text-sm font-semibold rounded-lg hover:bg-[#e6c24d] transition-colors"
              >
                Create P2P Wager
              </button>
              <button
                onClick={() => setMode('probability')}
                className="inline-flex items-center px-4 py-2 border border-[#2a2a35] text-[#e8e6e3] text-sm font-semibold rounded-lg hover:bg-[#1a1a22] transition-colors"
              >
                Browse Markets
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6">
        {/* Compact Stats */}
        <div className="py-6">
          <WagerMarketStats />
        </div>

        {/* Mode Tabs */}
        <div className="flex gap-1 border-b border-[#2a2a35] mb-6">
          <button
            onClick={() => {
              setMode('p2p')
              setShowCreateForm(false)
            }}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              mode === 'p2p'
                ? 'text-[#d8b13d] border-b-2 border-[#d8b13d]'
                : 'text-[#9a9a9a] hover:text-[#b8b6b1]'
            }`}
          >
            P2P Wagers
          </button>
          <button
            onClick={() => setMode('probability')}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              mode === 'probability'
                ? 'text-[#d8b13d] border-b-2 border-[#d8b13d]'
                : 'text-[#9a9a9a] hover:text-[#b8b6b1]'
            }`}
          >
            Probability Shop
          </button>
        </div>

        {/* P2P Wagers Mode */}
        {mode === 'p2p' && (
          <div className="grid md:grid-cols-3 gap-6 py-6">
            <div className="md:col-span-2">
              {showCreateForm ? (
                <>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="mb-4 text-sm text-[#9a9a9a] hover:text-[#d8b13d] transition-colors"
                  >
                    ← Back to Open Wagers
                  </button>
                  <CreateWager />
                </>
              ) : (
                <OpenWagers />
              )}
            </div>
            <div>
              {!showCreateForm && (
                <div className="space-y-4">
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="w-full px-4 py-2 bg-[#d8b13d] text-[#0a0a0c] text-sm font-semibold rounded-lg hover:bg-[#e6c24d] transition-colors"
                  >
                    + Create Wager
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Probability Shop Mode */}
        {mode === 'probability' && (
          <div className="py-6">
            <MarketsList />
          </div>
        )}
      </div>

      <SiteFooter />
    </main>
  )
}
