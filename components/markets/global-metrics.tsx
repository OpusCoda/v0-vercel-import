'use client'

import { TrendingUp, TrendingDown } from 'lucide-react'

interface GlobalMetricsProps {
  lockedValuePLS?: number
  pendingActions?: number
  claimablePLS?: number
  performance?: number // percentage, positive or negative
  isLoading?: boolean
}

export function GlobalMetrics({
  lockedValuePLS = 0,
  pendingActions = 0,
  claimablePLS = 0,
  performance = 0,
  isLoading = false,
}: GlobalMetricsProps) {
  const isPositivePerformance = performance >= 0

  const metrics = [
    {
      label: 'Locked value',
      value: lockedValuePLS.toLocaleString(undefined, { maximumFractionDigits: 0 }),
      suffix: 'PLS',
      icon: null,
    },
    {
      label: 'Pending Actions',
      value: pendingActions.toString(),
      suffix: '',
      icon: null,
      highlight: pendingActions > 0 ? 'orange' : undefined,
    },
    {
      label: 'Claimable',
      value: claimablePLS.toLocaleString(undefined, { maximumFractionDigits: 0 }),
      suffix: 'PLS',
      icon: null,
    },
    {
      label: 'Performance',
      value: Math.abs(performance).toLocaleString(undefined, { maximumFractionDigits: 1 }),
      suffix: '%',
      icon: isPositivePerformance ? (
        <TrendingUp className="h-4 w-4 text-green-400" />
      ) : (
        <TrendingDown className="h-4 w-4 text-red-400" />
      ),
      valueColor: isPositivePerformance ? 'text-green-400' : 'text-red-400',
    },
  ]

  return (
    <div className="rounded-2xl border border-[#2a2a35] bg-[#101017] p-6 mb-8">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className={`rounded-lg border p-4 ${
              metric.highlight === 'orange'
                ? 'border-orange-400/30 bg-orange-400/5'
                : 'border-[#2a2a35] bg-[#0d0d12]'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-sans text-xs text-[#7c7a76] uppercase tracking-wide">
                {metric.label}
              </p>
              {metric.icon && <div>{metric.icon}</div>}
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <p
                className={`font-serif text-xl font-bold ${
                  metric.valueColor || 'text-[#d4af37]'
                }`}
              >
                {isLoading ? '…' : metric.value}
              </p>
              {metric.suffix && (
                <span className="font-sans text-xs text-[#7c7a76]">
                  {metric.suffix}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
