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
    { label: 'Resolved', value: stats.totalResolved.toString(), suffix: 'wagers' },
    { label: 'Voided', value: stats.totalVoided.toString(), suffix: 'wagers' },
    { label: 'Protocol Fees', value: formatNumber(stats.totalProtocolFees), suffix: 'PLS' },
    { label: 'Staker Fees', value: formatNumber(stats.totalStakerFees), suffix: 'PLS' },
    { label: 'Payouts', value: formatNumber(stats.totalPayouts), suffix: 'PLS' },
    { label: 'Standard', value: stats.totalStandardWagers.toString(), suffix: '' },
    { label: 'Price Bets', value: stats.totalPriceBets.toString(), suffix: '' },
    { label: 'Open', value: stats.openWagerCount.toString(), suffix: '' },
  ]

  return (
    <div className="rounded-2xl border border-white/10 bg-[#111116]/40 backdrop-blur-sm p-6 mb-8">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-9 gap-6">
        {statItems.map((item) => (
          <div key={item.label}>
            <div className="text-xs font-semibold text-[#9a9a9a] uppercase tracking-wider mb-1">{item.label}</div>
            <div className="flex items-baseline gap-1">
              <div className="text-lg md:text-xl font-bold text-[#f4f4f4]">{item.value}</div>
              {item.suffix && <div className="text-xs text-[#9a9a9a]">{item.suffix}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
