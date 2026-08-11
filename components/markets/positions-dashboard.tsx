"use client"
import { useAccount } from "wagmi"
import { MyMarketPositions } from "@/components/markets/my-market-positions"
import { MyWagers } from "@/components/markets/my-wagers"
import { PositionsSummary } from "@/components/markets/positions-summary"
/**
 * The "My Positions" tab. Two stacked sections:
 *   1. Probability Shop — open positions with live value + unrealized P/L,
 *      and claim buttons for resolved/voided markets (winners must claim).
 *   2. Wager Market — the existing MyWagers dashboard (action items, active
 *      wagers, history, referral claims). Wager winnings are auto-paid on
 *      resolution, so no winnings-claim button is needed there.
 */
export function PositionsDashboard() {
  const { isConnected } = useAccount()
  if (!isConnected) {
    return (
      <div className="rounded-2xl border border-[#2a2a35] bg-[#101017] p-8 text-center">
        <p className="font-sans text-[#7c7a76]">Connect your wallet to see your positions</p>
      </div>
    )
  }
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <PositionsSummary />
      <div className="grid gap-8 lg:grid-cols-2 lg:divide-x lg:divide-[#2a2a35]">
        {/* Probability Shop */}
        <section className="lg:pr-8">
          <h2 className="mb-4 font-serif text-xl font-semibold text-[#B87333]">Probability Shop</h2>
          <MyMarketPositions />
        </section>
        {/* Wager Market — existing dashboard */}
        <section className="lg:pl-8">
          <h2 className="mb-4 font-serif text-xl font-semibold text-[#B87333]">Wager Market</h2>
          <MyWagers />
        </section>
      </div>
    </div>
  )
}