'use client'

const mockStakes = [
  ['#1247', '10,000 SMAUG', '🟡 Smaug', '730 days', '612 days', '83.8%', '1,842.72 SMAUG'],
  ['#1189', '5,000 SMAUG', '🟣 Elder Dragon', '365 days', '195 days', '53.4%', '542.18 SMAUG'],
  ['#1083', '2,500 SMAUG', '🔵 Dragon', '180 days', '96 days', '46.7%', '186.45 SMAUG'],
  ['#977', '1,000 SMAUG', '🟢 Drake', '90 days', '32 days', '35.6%', '28.34 SMAUG'],
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
              <tr key={stake[0]} className="hover:bg-[#09090B]">
                {stake.map((cell, i) => (
                  <td
                    key={i}
                    className={`px-6 py-4 text-sm ${
                      i === 6 ? 'font-semibold text-[#D8B13D]' : 'text-[#f4f4f4]'
                    }`}
                  >
                    {i === 5 ? (
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-24 rounded-full bg-[#1a1a20]">
                          <div
                            className="h-full rounded-full bg-[#D8B13D]"
                            style={{ width: cell }}
                          />
                        </div>
                        <span className="text-[#9a9a9a]">{cell}</span>
                      </div>
                    ) : (
                      cell
                    )}
                  </td>
                ))}

                <td className="px-6 py-4 text-right">
                  <button className="rounded-lg border border-[#D8B13D]/40 px-3 py-1.5 text-sm font-semibold text-[#D8B13D]">
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