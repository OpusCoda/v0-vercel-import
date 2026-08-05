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
  const played = performance.wins + performance.losses
  const performanceText =
    played > 0
      ? `${performance.wins}W • ${performance.losses}L (${performance.percentage}%)`
      : '—'
  const hasClaimable = claimablePLS > 0n
  const metrics = [
    {
      label: 'Locked value',
      value: formatPls(lockedValuePLS),
      suffix: 'PLS',
    },
    {
      label: 'Pending actions',
      value: pendingActionsCount.toString(),
      suffix: '',
      highlight: pendingActionsCount > 0 ? 'orange' : undefined,
    },
    {
      label: 'Claimable',
      value: formatPls(claimablePLS),
      suffix: 'PLS',
      // Gold-accent the claimable pill only when there's something to claim,
      // matching the Probability Shop summary strip.
      highlight: hasClaimable ? 'gold' : undefined,
    },
    {
      label: 'Performance',
      value: performanceText,
      suffix: '',
      valueColor:
        performance.percentage > 50
          ? 'text-green-400'
          : performance.percentage < 50 && played > 0
          ? 'text-red-400'
          : undefined,
    },
  ]
  return (
    <div className="mb-6 flex flex-wrap gap-3">
      {metrics.map((metric) => {
        const border =
          metric.highlight === 'orange'
            ? 'border-orange-400/30 bg-orange-400/5'
            : metric.highlight === 'gold'
            ? 'border-[#d4af37]/25 bg-[#d4af37]/[0.05]'
            : 'border-[#2a2a35] bg-[#101017]'
        const valueColor =
          metric.valueColor ||
          (metric.highlight === 'gold'
            ? 'text-[#d4af37]'
            : metric.highlight === 'orange'
            ? 'text-orange-400'
            : 'text-[#e8e6e3]')
        return (
          <div key={metric.label} className={`rounded-xl border px-4 py-3 ${border}`}>
            <div className="font-sans text-[10px] uppercase tracking-wider text-[#7c7a76]">
              {metric.label}
            </div>
            <div className="mt-0.5 flex items-baseline gap-1">
              <span className={`font-sans text-lg font-bold ${valueColor}`}>
                {isLoading ? '…' : metric.value}
              </span>
              {metric.suffix && (
                <span className="font-sans text-[10px] text-[#7c7a76]">{metric.suffix}</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}