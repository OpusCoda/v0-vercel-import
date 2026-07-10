'use client'
import { useOpenWagers } from '@/hooks/useOpenWagers'
function formatAddress(address: string): string {
  if (!address || address === '0x0000000000000000000000000000000000000000') return 'Open'
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}
function formatAmount(value: bigint): string {
  const num = Number(value) / 1e18
  return num.toLocaleString('en-US', { maximumFractionDigits: 2 })
}
function getWagerTypeLabel(type: number): string {
  const types: Record<number, string> = {
    0: 'Standard',
    1: 'Price Bet',
  }
  return types[type] || `Type ${type}`
}
// Matches the contract Status enum:
// { Created, Active, Voting, Resolved, Arbitration, Cancelled, Voided }
function getStatusLabel(status: number): string {
  const statuses: Record<number, string> = {
    0: 'Open',
    1: 'Active',
    2: 'Voting',
    3: 'Resolved',
    4: 'Arbitration',
    5: 'Cancelled',
    6: 'Voided',
  }
  return statuses[status] || `Status ${status}`
}
function getStatusColor(status: number): string {
  const colors: Record<number, string> = {
    0: 'bg-green-500/20 text-green-400 border-green-500/30',
    1: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    2: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    3: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    4: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    5: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    6: 'bg-red-500/20 text-red-400 border-red-500/30',
  }
  return colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'
}
export function OpenWagers() {
  const { wagers, isLoading } = useOpenWagers()
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111116]/40 backdrop-blur-sm p-6">
      <h2 className="font-serif text-xl font-bold text-[#e8e6e3] mb-4">Open Wagers</h2>

      {isLoading ? (
        <div className="text-center text-[#9a9a9a] py-6 text-sm">Loading wagers...</div>
      ) : wagers.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-[#9a9a9a] text-sm mb-1">No open wagers yet</div>
          <div className="text-[#666] text-xs">Be the first to create one</div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase text-[#9a9a9a]">
              <tr>
                <th className="pb-3 px-4">ID</th>
                <th className="pb-3 px-4">Type</th>
                <th className="pb-3 px-4">Creator</th>
                <th className="pb-3 px-4">Stake</th>
                <th className="pb-3 px-4">Odds</th>
                <th className="pb-3 px-4">Status</th>
                <th className="pb-3 px-4">Accept by</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {wagers.map((wager) => {
                const expiresDate = new Date(Number(wager.depositDeadline) * 1000)
                const isExpired = expiresDate < new Date()
                // Implied odds: challenger stake per unit of creator stake.
                const odds =
                  wager.creatorStake && wager.creatorStake > 0n
                    ? Number(wager.challengerStake) / Number(wager.creatorStake)
                    : 0
                return (
                  <tr key={wager.id.toString()} className="text-[#f4f4f4] hover:bg-white/5 transition">
                    <td className="py-3 px-4 font-mono text-xs">#{wager.id.toString()}</td>
                    <td className="py-3 px-4 text-sm">{getWagerTypeLabel(wager.wagerType)}</td>
                    <td className="py-3 px-4 text-[#9a9a9a] text-sm">{formatAddress(wager.creator)}</td>
                    <td className="py-3 px-4 text-sm font-semibold">{formatAmount(wager.creatorStake)} PLS</td>
                    <td className="py-3 px-4 text-sm">{odds.toFixed(2)}:1</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full border text-xs font-semibold ${getStatusColor(
                          wager.status
                        )}`}
                      >
                        {getStatusLabel(wager.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#9a9a9a] text-sm">
                      {expiresDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                      {isExpired && <span className="text-red-400 ml-1 text-xs">(Expired)</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
