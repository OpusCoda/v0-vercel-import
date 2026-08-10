'use client'

import { useAccount, useBalance } from 'wagmi'
import { usePlsPrice } from '@/hooks/usePlsPrice'

// Tokens shown on the left ticker, in display order. SMAUG first (ecosystem token),
// then the majors. Labels must match the keys in usePlsPrice's PAIRS map.
const TICKER_TOKENS = ['SMAUG', 'PLS', 'PLSX', 'INC'] as const

// Format a USD price with sensible precision — sub-cent tokens (PLS, SMAUG)
// need more decimals than dollar-plus tokens.
function formatUsd(price: number | null): string {
  if (price == null) return '—'
  if (price >= 1) return `$${price.toLocaleString('en-US', { maximumFractionDigits: 4 })}`
  // Sub-$1: show up to 6 significant digits so fractions-of-a-cent stay readable.
  return `$${price.toLocaleString('en-US', { maximumSignificantDigits: 6 })}`
}

function PriceTicker() {
  // One hook call per token — each polls DexScreener on its own 60s interval.
  const smaug = usePlsPrice('SMAUG')
  const pls = usePlsPrice('PLS')
  const plsx = usePlsPrice('PLSX')
  const inc = usePlsPrice('INC')

  const prices: Record<string, number | null> = { SMAUG: smaug, PLS: pls, PLSX: plsx, INC: inc }

  return (
    <div className="flex items-center gap-4 overflow-x-auto">
      {TICKER_TOKENS.map((label) => (
        <div key={label} className="flex items-center gap-1.5 whitespace-nowrap text-xs">
          <span className="font-semibold text-[#cfcfcf]">{label}</span>
          <span className="text-[#9a9a9a]">{formatUsd(prices[label])}</span>
        </div>
      ))}
    </div>
  )
}

function WalletBalance() {
  const { address, isConnected } = useAccount()
  const { data, isLoading } = useBalance({
    address,
    query: { enabled: !!address, refetchInterval: 30000 },
  })

  if (!isConnected) return null

  const formatted = isLoading || !data
    ? '—'
    : Number(data.formatted).toLocaleString('en-US', { maximumFractionDigits: 2 })

  return (
    <div className="flex items-center gap-1.5 whitespace-nowrap text-xs">
      <span className="text-[#9a9a9a]">Balance</span>
      <span className="font-semibold text-[#D8B13D]">{formatted} PLS</span>
    </div>
  )
}

export function TopBar() {
  return (
    <div className="w-full border-b border-white/10 bg-[#0a0b0d]">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-2">
        <PriceTicker />
        <WalletBalance />
      </div>
    </div>
  )
}