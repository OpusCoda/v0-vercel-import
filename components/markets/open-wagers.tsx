'use client'

import { useOpenWagers } from '@/hooks/useOpenWagers'

function formatAddress(address: string): string {
  if (!address || address === '0x0000000000000000000000000000000000000000') return 'N/A'
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

function getStatusLabel(status: number): string {
  const statuses: Record<number, string> = {
    0: 'Open',
    1: 'Matched',
    2: 'Resolved',
    3: 'Voided',
  }
  return statuses[status] || `Status ${status}`
}

function getStatusColor(status: number): string {
  const colors: Record<number, string> = {
    0: 'bg-green-500/20 text-green-400 border-green-500/30',
    1: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    2: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    3: 'bg-red-500/20 text-red-400 border-red-500/30',
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
                <th className="pb-3 px-4">Amount</th>
                <th className="pb-3 px-4">Odds</th>
                <th className="pb-3 px-4">Status</th>
                <th className="pb-3 px-4">Expires</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {wagers.map((wager, idx) => {
                if (!wager || !wager.id) return null
                
                const expiresDate = new Date(Number(wager.expiresAt || 0) * 1000)
                const isExpired = expiresDate < new Date()

                return (
                  <tr key={`wager-${idx}`} className="text-[#f4f4f4] hover:bg-white/5 transition">
                    <td className="py-3 px-4 font-mono text-xs">#{wager.id.toString()}</td>
                    <td className="py-3 px-4 text-sm">{getWagerTypeLabel(wager.wagerType || 0)}</td>
                    <td className="py-3 px-4 text-[#9a9a9a] text-sm">{formatAddress(wager.creator || '0x0000000000000000000000000000000000000000')}</td>
                    <td className="py-3 px-4 text-sm font-semibold">{formatAmount(wager.amount || BigInt(0))} PLS</td>
                    <td className="py-3 px-4 text-sm">{Number(wager.odds || 0) / 100}:1</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full border text-xs font-semibold ${getStatusColor(
                          wager.status || 0
                        )}`}
                      >
                        {getStatusLabel(wager.status || 0)}
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
