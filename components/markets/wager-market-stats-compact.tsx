'use client'

import { useWagerMarketStats } from '@/hooks/useWagerMarketStats'

function formatNumber(value: bigint): string {
  const num = Number(value) / 1e18
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M'
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K'
  return num.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

export function WagerMarketStatsCompact() {
  const stats = useWagerMarketStats()

  const statItems = [
    { label: 'Total Volume', value: formatNumber(stats.totalVolume), suffix: 'PLS' },
    { label: 'Open Wagers', value: stats.openWagerCount.toString(), suffix: '' },
    { label: 'Resolved', value: stats.totalResolved.toString(), suffix: '' },
    { label: 'Fees Collected', value: formatNumber(stats.totalProtocolFees), suffix: 'PLS' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statItems.map((item) => (
        <div key={item.label} className="rounded-lg border border-white/5 bg-white/2 p-3">
          <div className="text-xs font-semibold text-[#9a9a9a] uppercase tracking-wide mb-1">
            {item.label}
          </div>
          <div className="flex items-baseline gap-1">
            <div className="text-lg font-bold text-[#f4f4f4]">{item.value}</div>
            {item.suffix && <div className="text-xs text-[#9a9a9a]">{item.suffix}</div>}
          </div>
        </div>
      ))}
    </div>
  )
}
