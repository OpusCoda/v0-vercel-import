'use client'

import { useWagerMarketStats } from '@/hooks/useWagerMarketStats'

function formatNumber(value: bigint): string {
  const num = Number(value) / 1e18
  return num.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

export function WagerMarketStats() {
  const stats = useWagerMarketStats()

  const statItems = [
    { label: 'Total Volume', value: formatNumber(stats.totalVolume), suffix: 'PLS' },
    { label: 'Total Resolved', value: stats.totalResolved.toString(), suffix: 'wagers' },
    { label: 'Total Voided', value: stats.totalVoided.toString(), suffix: 'wagers' },
    { label: 'Protocol Fees', value: formatNumber(stats.totalProtocolFees), suffix: 'PLS' },
    { label: 'Staker Fees', value: formatNumber(stats.totalStakerFees), suffix: 'PLS' },
    { label: 'Total Payouts', value: formatNumber(stats.totalPayouts), suffix: 'PLS' },
    { label: 'Standard Wagers', value: stats.totalStandardWagers.toString(), suffix: 'count' },
    { label: 'Price Bets', value: stats.totalPriceBets.toString(), suffix: 'count' },
    { label: 'Open Wagers', value: stats.openWagerCount.toString(), suffix: 'count' },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      {statItems.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-white/10 bg-[#111116] p-4 hover:border-white/20 transition"
        >
          <div className="text-sm text-[#9a9a9a] mb-2">{item.label}</div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold text-[#f4f4f4]">{item.value}</div>
            <div className="text-sm text-[#9a9a9a]">{item.suffix}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
