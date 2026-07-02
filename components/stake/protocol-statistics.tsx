export default function ProtocolStatistics() {
  // TODO: Fetch these values from contract
  const stats = {
    currentAPR: 38.42,
    totalRewardsDistributed: 1248392,
    totalBurned: 387744071,
    averageStakeDuration: 210,
    largestStake: 250000,
    treasuryBalance: 12543,
  }

  return (
    <div className="border border-[rgba(255,255,255,0.08)] rounded-lg bg-[#111116] p-8">
      <h2 className="font-serif text-2xl font-bold text-[#f4f4f4] mb-8">
        Protocol Statistics
      </h2>

      <div className="grid grid-cols-1 gap-8">
        {/* Top Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          <div>
            <p className="font-sans text-xs font-semibold text-[#9a9a9a] uppercase tracking-wide mb-3">
              Current APR
            </p>
            <p className="font-serif text-2xl font-bold text-[#10b981]">
              {stats.currentAPR}%
            </p>
          </div>

          <div>
            <p className="font-sans text-xs font-semibold text-[#9a9a9a] uppercase tracking-wide mb-3">
              Total Rewards Distributed
            </p>
            <p className="font-serif text-2xl font-bold text-[#D8B13D]">
              {(stats.totalRewardsDistributed / 1000000).toFixed(1)}M
            </p>
            <p className="font-sans text-sm text-[#9a9a9a] mt-1">
              SMAUG
            </p>
          </div>

          <div>
            <p className="font-sans text-xs font-semibold text-[#9a9a9a] uppercase tracking-wide mb-3">
              Total Burned
            </p>
            <p className="font-serif text-2xl font-bold text-[#f4f4f4]">
              {(stats.totalBurned / 1000000).toFixed(0)}M
            </p>
            <p className="font-sans text-sm text-[#9a9a9a] mt-1">
              SMAUG
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-[rgba(255,255,255,0.08)]" />

        {/* Bottom Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          <div>
            <p className="font-sans text-xs font-semibold text-[#9a9a9a] uppercase tracking-wide mb-3">
              Average Stake Duration
            </p>
            <p className="font-serif text-2xl font-bold text-[#f4f4f4]">
              {stats.averageStakeDuration}
            </p>
            <p className="font-sans text-sm text-[#9a9a9a] mt-1">
              days
            </p>
          </div>

          <div>
            <p className="font-sans text-xs font-semibold text-[#9a9a9a] uppercase tracking-wide mb-3">
              Largest Stake
            </p>
            <p className="font-serif text-2xl font-bold text-[#f4f4f4]">
              {stats.largestStake.toLocaleString('en-US')}
            </p>
            <p className="font-sans text-sm text-[#9a9a9a] mt-1">
              SMAUG
            </p>
          </div>

          <div>
            <p className="font-sans text-xs font-semibold text-[#9a9a9a] uppercase tracking-wide mb-3">
              Treasury Balance
            </p>
            <p className="font-serif text-2xl font-bold text-[#f4f4f4]">
              {stats.treasuryBalance.toLocaleString('en-US')}
            </p>
            <p className="font-sans text-sm text-[#9a9a9a] mt-1">
              SMAUG
            </p>
          </div>
        </div>
      </div>

      {/* Info note */}
      <div className="mt-8 flex items-start gap-3 p-4 bg-[#0a0a0c] border border-[rgba(255,255,255,0.08)] rounded-lg">
        <span className="text-[#D8B13D] text-lg mt-0.5">ℹ️</span>
        <p className="font-sans text-sm text-[#9a9a9a]">
          APR is variable and updates in real-time based on network conditions.
        </p>
      </div>
    </div>
  )
}
