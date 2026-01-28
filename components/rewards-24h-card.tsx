"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

interface Rewards24hData {
  available: boolean
  changes?: {
    missor: number
    finvesta: number
    wgpp: number
    weth: number
    pwbtc: number
    plsx: number
  }
}

interface TokenPrices {
  missor: number
  finvesta: number
  wgpp: number
  weth: number
  Pwbtc: number
  plsx: number
}

function formatWithCommas(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value) : value
  if (isNaN(num)) return "0"
  return num.toLocaleString("en-US", { maximumFractionDigits: 2 })
}

export function Rewards24hCard({ tokenPrices }: { tokenPrices: TokenPrices | null }) {
  const [data, setData] = useState<Rewards24hData | null>(null)

  useEffect(() => {
    fetch("/api/rewards-24h")
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch(() => setData({ available: false }))
  }, [])

  // Don't render anything until real data is available
  if (!data || !data.available || !data.changes) {
    return null
  }

  const totalUsdChange = tokenPrices
    ? data.changes.missor * tokenPrices.missor +
      data.changes.finvesta * tokenPrices.finvesta +
      data.changes.wgpp * tokenPrices.wgpp +
      data.changes.weth * tokenPrices.weth +
      data.changes.pwbtc * tokenPrices.Pwbtc +
      data.changes.plsx * tokenPrices.plsx
    : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto mt-6 px-4"
    >
      <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/10 border border-green-500/30 rounded-xl p-5">
        <h3 className="text-lg font-medium text-green-400 text-center mb-4">
          Last 24 hours: +${formatWithCommas(totalUsdChange.toFixed(0))}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <div className="flex justify-between bg-slate-800/30 rounded-lg px-3 py-2">
            <span className="text-slate-400">Missor</span>
            <span className="text-green-400">+{formatWithCommas(data.changes.missor.toFixed(0))}</span>
          </div>
          <div className="flex justify-between bg-slate-800/30 rounded-lg px-3 py-2">
            <span className="text-slate-400">Finvesta</span>
            <span className="text-green-400">+{formatWithCommas(data.changes.finvesta.toFixed(2))}</span>
          </div>
          <div className="flex justify-between bg-slate-800/30 rounded-lg px-3 py-2">
            <span className="text-slate-400">WGPP</span>
            <span className="text-green-400">+{formatWithCommas(data.changes.wgpp.toFixed(0))}</span>
          </div>
          <div className="flex justify-between bg-slate-800/30 rounded-lg px-3 py-2">
            <span className="text-slate-400">WETH</span>
            <span className="text-green-400">+{data.changes.weth.toFixed(4)}</span>
          </div>
          <div className="flex justify-between bg-slate-800/30 rounded-lg px-3 py-2">
            <span className="text-slate-400">pWBTC</span>
            <span className="text-green-400">+{data.changes.pwbtc.toFixed(4)}</span>
          </div>
          <div className="flex justify-between bg-slate-800/30 rounded-lg px-3 py-2">
            <span className="text-slate-400">PLSX</span>
            <span className="text-green-400">+{formatWithCommas(data.changes.plsx.toFixed(0))}</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
