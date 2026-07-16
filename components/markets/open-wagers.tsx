'use client'
import { useOpenWagers } from '@/hooks/useOpenWagers'

function formatAddress(address: string): string {
  if (!address || address === '0x0000000000000000000000000000000000000000') return 'Open to anyone'
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}
function formatAmount(value: bigint): string {
  const num = Number(value) / 1e18
  return num.toLocaleString('en-US', { maximumFractionDigits: 2 })
}
function getWagerTypeLabel(type: number): string {
  return type === 1 ? 'Price Bet' : 'Standard'
}
// On-chain Status: 0 Created,1 Active,2 Voting,3 Resolved,4 Arbitration,5 Cancelled,6 Voided
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
  return statuses[status] ?? `Status ${status}`
}
function getStatusColor(status: number): string {
  const colors: Record<number, string> = {
    0: 'bg-green-500/20 text-green-400 border-green-500/30',
    1: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    2: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    3: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    4: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    5: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    6: 'bg-red-500/20 text-red-400 border-red-500/30',
  }
  return colors[status] ?? 'bg-gray-500/20 text-gray-400 border-gray-500/30'
}
// Odds as challenger : creator stake ratio.
function formatOdds(creatorStake: bigint, challengerStake: bigint): string {
  if (!creatorStake || creatorStake === BigInt(0)) return '—'
  const ratio = Number(challengerStake) / Number(creatorStake)
  return `${ratio.toLocaleString('en-US', { maximumFractionDigits: 2 })}:1`
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
                <th className="pb-3 px-4">Creator Stake</th>
                <th className="pb-3 px-4">Odds</th>
                <th className="pb-3 px-4">Status</th>
                <th className="pb-3 px-4">Accept By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {wagers.map((wager, idx) => {
                if (!wager || wager.id === undefined) return null

                const deadline = new Date(Number(wager.depositDeadline || 0) * 1000)
                const isExpired = deadline < new Date()
                return (
                  <tr key={`wager-${idx}`} className="text-[#f4f4f4] hover:bg-white/5 transition">
                    <td className="py-3 px-4 font-mono text-xs">#{wager.id.toString()}</td>
                    <td className="py-3 px-4 text-sm">{getWagerTypeLabel(wager.wagerType)}</td>
                    <td className="py-3 px-4 text-[#9a9a9a] text-sm">{formatAddress(wager.creator)}</td>
                    <td className="py-3 px-4 text-sm font-semibold">{formatAmount(wager.creatorStake)} PLS</td>
                    <td className="py-3 px-4 text-sm">{formatOdds(wager.creatorStake, wager.challengerStake)}</td>
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
                      {deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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