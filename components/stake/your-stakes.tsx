'use client'

import EggIcon from './egg-icon'

const mockStakes = [
  { id: '#1247', amount: '10,000 SMAUG', tier: 'Smaug', eggTier: 'smaug' as const, duration: '730 days', daysRemaining: '612 days', progress: '83.8%', rewards: '1,842.72 SMAUG' },
  { id: '#1189', amount: '5,000 SMAUG', tier: 'Elder Dragon', eggTier: 'elder-dragon' as const, duration: '365 days', daysRemaining: '195 days', progress: '53.4%', rewards: '542.18 SMAUG' },
  { id: '#1083', amount: '2,500 SMAUG', tier: 'Dragon', eggTier: 'dragon' as const, duration: '180 days', daysRemaining: '96 days', progress: '46.7%', rewards: '186.45 SMAUG' },
  { id: '#977', amount: '1,000 SMAUG', tier: 'Drake', eggTier: 'drake' as const, duration: '90 days', daysRemaining: '32 days', progress: '35.6%', rewards: '28.34 SMAUG' },
]

export default function YourStakes() {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111116]">
      <div className="flex items-center justify-between border-b border-white/10 p-6">
        <h2 className="font-serif text-2xl font-bold text-[#f4f4f4]">
          Your Stakes
        </h2>

        <button className="text-sm font-semibold text-[#D8B13D]">
          View All Stakes →
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left">
          <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-[#9a9a9a]">
            <tr>
              {[
                'Stake ID',
                'Amount',
                'Tier',
                'Duration',
                'Days Remaining',
                'Progress',
                'Rewards Earned',
                'Actions',
              ].map((heading) => (
                <th key={heading} className="px-6 py-4 font-semibold">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-white/10">
            {mockStakes.map((stake) => (
              <tr key={stake.id} className="hover:bg-[#09090B]">
                <td className="px-6 py-4 text-sm text-[#f4f4f4]">{stake.id}</td>
                <td className="px-6 py-4 text-sm text-[#f4f4f4]">{stake.amount}</td>
                <td className="px-6 py-4 text-sm text-[#f4f4f4]">
                  <div className="flex items-center gap-2">
                    <EggIcon tier={stake.eggTier} />
                    {stake.tier}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-[#f4f4f4]">{stake.duration}</td>
                <td className="px-6 py-4 text-sm text-[#f4f4f4]">{stake.daysRemaining}</td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-24 rounded-full bg-[#1a1a20]">
                      <div
                        className="h-full rounded-full bg-[#D8B13D]"
                        style={{ width: stake.progress }}
                      />
                    </div>
                    <span className="text-[#9a9a9a]">{stake.progress}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-[#D8B13D]">{stake.rewards}</td>
                <td className="px-6 py-4 text-right">
                  <button className="rounded-lg border border-[#D8B13D]/40 px-3 py-1.5 text-sm font-semibold text-[#D8B13D] hover:bg-[#D8B13D]/10 transition-colors">
                    Manage
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
