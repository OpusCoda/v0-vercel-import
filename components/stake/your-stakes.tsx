'use client'

interface Stake {
  id: string
  amount: number
  tier: string
  duration: number
  daysRemaining: number
  progress: number
  rewardsEarned: number
  color: string
}

const mockStakes: Stake[] = [
  {
    id: '#1247',
    amount: 10000,
    tier: 'Smaug',
    duration: 730,
    daysRemaining: 612,
    progress: 83.8,
    rewardsEarned: 1842.72,
    color: 'from-[#D8B13D]',
  },
  {
    id: '#1189',
    amount: 5000,
    tier: 'Elder Dragon',
    duration: 365,
    daysRemaining: 195,
    progress: 53.4,
    rewardsEarned: 542.18,
    color: 'from-purple-500',
  },
  {
    id: '#1083',
    amount: 2500,
    tier: 'Dragon',
    duration: 180,
    daysRemaining: 96,
    progress: 46.7,
    rewardsEarned: 186.45,
    color: 'from-cyan-500',
  },
  {
    id: '#977',
    amount: 1000,
    tier: 'Drake',
    duration: 90,
    daysRemaining: 32,
    progress: 35.6,
    rewardsEarned: 28.34,
    color: 'from-green-500',
  },
]

const tierIcons = {
  Hatchling: '🥚',
  Drake: '🐢',
  Dragon: '🐉',
  'Elder Dragon': '👹',
  Smaug: '🐲',
}

export default function YourStakes() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-serif text-2xl font-bold text-[#f4f4f4]">
          Your Stakes
        </h2>
        <button className="font-sans text-sm font-semibold text-[#D8B13D] hover:text-[#D8B13D]/80">
          View All Stakes →
        </button>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto border border-[rgba(255,255,255,0.08)] rounded-lg bg-[#111116]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[rgba(255,255,255,0.08)]">
              <th className="px-6 py-4 text-left font-sans text-xs font-semibold text-[#9a9a9a] uppercase tracking-wide">
                Stake ID
              </th>
              <th className="px-6 py-4 text-left font-sans text-xs font-semibold text-[#9a9a9a] uppercase tracking-wide">
                Amount
              </th>
              <th className="px-6 py-4 text-left font-sans text-xs font-semibold text-[#9a9a9a] uppercase tracking-wide">
                Tier
              </th>
              <th className="px-6 py-4 text-left font-sans text-xs font-semibold text-[#9a9a9a] uppercase tracking-wide">
                Duration
              </th>
              <th className="px-6 py-4 text-left font-sans text-xs font-semibold text-[#9a9a9a] uppercase tracking-wide">
                Days Remaining
              </th>
              <th className="px-6 py-4 text-left font-sans text-xs font-semibold text-[#9a9a9a] uppercase tracking-wide">
                Progress
              </th>
              <th className="px-6 py-4 text-left font-sans text-xs font-semibold text-[#9a9a9a] uppercase tracking-wide">
                Rewards Earned
              </th>
              <th className="px-6 py-4 text-right font-sans text-xs font-semibold text-[#9a9a9a] uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {mockStakes.map((stake) => (
              <tr key={stake.id} className="border-b border-[rgba(255,255,255,0.08)] hover:bg-[#0a0a0c] transition-colors">
                <td className="px-6 py-4 font-sans font-semibold text-[#f4f4f4]">
                  {stake.id}
                </td>
                <td className="px-6 py-4 font-sans text-[#f4f4f4]">
                  {stake.amount.toLocaleString('en-US')} SMAUG
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{tierIcons[stake.tier as keyof typeof tierIcons]}</span>
                    <span className="font-sans font-semibold text-[#f4f4f4]">
                      {stake.tier}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 font-sans text-[#f4f4f4]">
                  {stake.duration} days
                </td>
                <td className="px-6 py-4 font-sans text-[#f4f4f4]">
                  {stake.daysRemaining} days
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-[#1a1a20] rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${stake.color} to-[#D8B13D]`}
                        style={{ width: `${stake.progress}%` }}
                      />
                    </div>
                    <span className="font-sans text-sm text-[#9a9a9a]">
                      {stake.progress}%
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 font-sans font-semibold text-[#D8B13D]">
                  {stake.rewardsEarned.toLocaleString('en-US', { maximumFractionDigits: 2 })} SMAUG
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="font-sans text-sm font-semibold text-[#D8B13D] hover:text-[#D8B13D]/80">
                    Manage ↓
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {mockStakes.map((stake) => (
          <div
            key={stake.id}
            className="border border-[rgba(255,255,255,0.08)] rounded-lg bg-[#111116] p-4"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="font-sans font-semibold text-[#D8B13D] text-sm">
                  {stake.id}
                </p>
                <p className="font-sans text-sm text-[#f4f4f4] mt-1">
                  {stake.amount.toLocaleString('en-US')} SMAUG
                </p>
              </div>
              <button className="font-sans text-sm font-semibold text-[#D8B13D]">
                Manage
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="font-sans text-xs text-[#9a9a9a] mb-1">Tier</p>
                <p className="font-sans font-semibold text-[#f4f4f4]">
                  {tierIcons[stake.tier as keyof typeof tierIcons]} {stake.tier}
                </p>
              </div>
              <div>
                <p className="font-sans text-xs text-[#9a9a9a] mb-1">Days Remaining</p>
                <p className="font-sans font-semibold text-[#f4f4f4]">
                  {stake.daysRemaining} days
                </p>
              </div>
            </div>

            <div className="mb-4">
              <p className="font-sans text-xs text-[#9a9a9a] mb-2">Progress</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-[#1a1a20] rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${stake.color} to-[#D8B13D]`}
                    style={{ width: `${stake.progress}%` }}
                  />
                </div>
                <span className="font-sans text-sm text-[#9a9a9a] w-10 text-right">
                  {stake.progress}%
                </span>
              </div>
            </div>

            <div>
              <p className="font-sans text-xs text-[#9a9a9a] mb-1">Rewards Earned</p>
              <p className="font-sans font-semibold text-[#D8B13D]">
                {stake.rewardsEarned.toLocaleString('en-US', { maximumFractionDigits: 2 })} SMAUG
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* View All button */}
      <div className="mt-8 text-center md:hidden">
        <button className="font-sans text-sm font-semibold text-[#D8B13D] hover:text-[#D8B13D]/80">
          View All Stakes ↓
        </button>
      </div>
    </div>
  )
}
