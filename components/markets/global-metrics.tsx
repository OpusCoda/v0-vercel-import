'use client'

interface GlobalMetricsProps {
  lockedValuePLS?: bigint
  pendingActionsCount?: number
  claimablePLS?: bigint
  performance?: {
    wins: number
    losses: number
    percentage: number
  }
  isLoading?: boolean
}

export function GlobalMetrics({
  lockedValuePLS = 0n,
  pendingActionsCount = 0,
  claimablePLS = 0n,
  performance = { wins: 0, losses: 0, percentage: 0 },
  isLoading = false,
}: GlobalMetricsProps) {
  const formatPls = (value: bigint) =>
    (Number(value) / 1e18).toLocaleString(undefined, {
      maximumFractionDigits: 0,
    })

  const performanceText =
    performance.wins + performance.losses > 0
      ? `${performance.wins}W • ${performance.losses}L (${performance.percentage}%)`
      : '—'

  const metrics = [
    {
      label: 'Locked value',
      value: formatPls(lockedValuePLS),
      suffix: 'PLS',
    },
    {
      label: 'Pending Actions',
      value: pendingActionsCount.toString(),
      suffix: '',
      highlight: pendingActionsCount > 0 ? 'orange' : undefined,
    },
    {
      label: 'Claimable',
      value: formatPls(claimablePLS),
      suffix: 'PLS',
    },
    {
      label: 'Performance',
      value: performanceText,
      suffix: '',
      valueColor: performance.percentage > 50 ? 'text-green-400' : performance.percentage < 50 && performance.wins + performance.losses > 0 ? 'text-red-400' : undefined,
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
