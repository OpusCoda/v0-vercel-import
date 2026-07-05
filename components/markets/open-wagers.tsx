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

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#111116] p-6">
        <h2 className="font-serif text-2xl font-bold mb-6">Open Wagers</h2>
        <div className="text-center text-[#9a9a9a] py-8">Loading wagers...</div>
      </div>
    )
  }

  if (wagers.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#111116] p-6">
        <h2 className="font-serif text-2xl font-bold mb-6">Open Wagers</h2>
        <div className="text-center text-[#9a9a9a] py-8">No open wagers at the moment</div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#111116] p-6">
      <h2 className="font-serif text-2xl font-bold mb-6">Open Wagers</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase text-[#9a9a9a]">
            <tr>
              <th className="pb-4 px-4">ID</th>
              <th className="pb-4 px-4">Type</th>
              <th className="pb-4 px-4">Creator</th>
              <th className="pb-4 px-4">Amount</th>
              <th className="pb-4 px-4">Odds</th>
              <th className="pb-4 px-4">Status</th>
              <th className="pb-4 px-4">Expires At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {wagers.map((wager) => {
              const expiresDate = new Date(Number(wager.expiresAt) * 1000)
              const isExpired = expiresDate < new Date()

              return (
                <tr key={wager.id.toString()} className="text-[#f4f4f4] hover:bg-[#09090B]">
                  <td className="py-4 px-4 font-mono text-sm">#{wager.id.toString()}</td>
                  <td className="py-4 px-4">{getWagerTypeLabel(wager.wagerType)}</td>
                  <td className="py-4 px-4 text-[#9a9a9a]">{formatAddress(wager.creator)}</td>
                  <td className="py-4 px-4">{formatAmount(wager.amount)} PLS</td>
                  <td className="py-4 px-4">{Number(wager.odds) / 100}:1</td>
                  <td className="py-4 px-4">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full border text-xs font-semibold ${getStatusColor(
                        wager.status
                      )}`}
                    >
                      {getStatusLabel(wager.status)}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-[#9a9a9a]">
                    {expiresDate.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {isExpired && <span className="text-red-400 ml-2">(Expired)</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
