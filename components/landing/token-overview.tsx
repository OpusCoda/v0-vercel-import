"use client"

import { useEffect, useRef, useState } from "react"
import { ethers } from "ethers"
import { RefreshCw, Copy, Check, Mountain } from "lucide-react"
import {
  SMAUG_ADDRESS,
  SMAUG_ABI,
  BALANCE_ABI,
  PWBTC_ADDRESS,
  SMAUG_VAULT_ADDRESS,
  SMAUG_HOARD_ADDRESS,
  GAS_MONEY_ADDRESS,
  DOMINANCE_ADDRESS,
  BURN_ADDRESS,
  getProvider,
  rpcRetry,
  formatMillions,
} from "@/lib/onchain"
import { storeSmaugRoiSnapshot, getSmaugRoi } from "@/app/actions"

type HoardData = {
  pls: number
  pWbtc: number
  pWbtcPrice: number
}

export function TokenOverview() {
  const [smaugLpPls, setSmaugLpPls] = useState<string | null>(null)
  const [smaugPrice, setSmaugPrice] = useState(0)
  const [plsPrice, setPlsPrice] = useState(0)
  const [smaugMarketCap, setSmaugMarketCap] = useState(0)
  const [smaugLiquidity, setSmaugLiquidity] = useState(0)
  const [smaugTotalBurned, setSmaugTotalBurned] = useState(0)
  const [smaugVaultPLS, setSmaugVaultPLS] = useState(0)
  const [smaugVaultBurned, setSmaugVaultBurned] = useState(0)
  const [smaugHoardBurned, setSmaugHoardBurned] = useState(0)
  const [hoardData, setHoardData] = useState<HoardData>({ pls: 0, pWbtc: 0, pWbtcPrice: 0 })
  const [roi24h, setRoi24h] = useState<number | null>(null)
  const [roi7d, setRoi7d] = useState<number | null>(null)
  const [roi30d, setRoi30d] = useState<number | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  const cachedPricesRef = useRef<any>(null)

  const fetchCachedPrices = async () => {
    try {
      const res = await fetch("/api/prices")
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      cachedPricesRef.current = data
      return data
    } catch (err) {
      console.error("[v0] Error fetching cached prices:", err)
      return null
    }
  }

  const fetchSmaugLPEvents = async () => {
    try {
      const provider = getProvider()
      const smaugContract = new ethers.Contract(SMAUG_ADDRESS, SMAUG_ABI, provider)
      const lpFilter = smaugContract.filters.LPAdded()
      const lpEvents = await rpcRetry(() => smaugContract.queryFilter(lpFilter, 0, "latest"), 2, 3000)
      let totalPLS = 0n
      for (const event of lpEvents) {
        const log = event as ethers.EventLog
        totalPLS += BigInt(log.args[1])
      }
      setSmaugLpPls(ethers.formatUnits(totalPLS, 18))
    } catch (error) {
      console.error("[v0] Failed to fetch Smaug LP events:", error)
    }
  }

  const fetchSmaugVaultData = async (prices?: any) => {
    const p = prices || cachedPricesRef.current
    if (p) {
      setPlsPrice(p.pls || 0)
      setSmaugPrice(p.smaug || 0)
      setSmaugMarketCap(p.smaugMarketCap || 0)
      setSmaugLiquidity(p.smaugLiquidity || 0)
    }

    const provider = getProvider()
    const smaugContract = new ethers.Contract(SMAUG_ADDRESS, SMAUG_ABI, provider)

    try {
      const vaultBalance = await rpcRetry(() => provider.getBalance(SMAUG_VAULT_ADDRESS))
      setSmaugVaultPLS(Number(ethers.formatEther(vaultBalance)))
    } catch (err) {
      console.error("[v0] Error fetching vault PLS balance:", err)
    }

    try {
      const hoardPlsBalance = await rpcRetry(() => provider.getBalance(SMAUG_HOARD_ADDRESS))
      const pWbtcContract = new ethers.Contract(PWBTC_ADDRESS, BALANCE_ABI, provider)
      const pWbtcBal = await rpcRetry(() => pWbtcContract.balanceOf(SMAUG_HOARD_ADDRESS))
      setHoardData({
        pls: Number(ethers.formatEther(hoardPlsBalance)),
        pWbtc: Number(ethers.formatUnits(pWbtcBal, 8)),
        pWbtcPrice: p?.pwbtc || 0,
      })
    } catch (err) {
      console.error("[v0] Error fetching hoard balances:", err)
    }

    await new Promise((r) => setTimeout(r, 1000))

    try {
      let burned
      try {
        burned = await rpcRetry(() => smaugContract.totalBurned())
      } catch {
        burned = await rpcRetry(() => smaugContract.balanceOf(BURN_ADDRESS))
      }
      setSmaugTotalBurned(Number(ethers.formatEther(burned)))
    } catch (err) {
      console.error("[v0] Error fetching total burned:", err)
    }

    await new Promise((r) => setTimeout(r, 1000))

    try {
      const transferFilter = smaugContract.filters.Transfer
      const [vaultBurnEvents, hoardBurnEvents] = await Promise.all([
        rpcRetry(() => smaugContract.queryFilter(transferFilter(SMAUG_VAULT_ADDRESS, BURN_ADDRESS)), 2, 3000),
        rpcRetry(() => smaugContract.queryFilter(transferFilter(SMAUG_HOARD_ADDRESS, BURN_ADDRESS)), 2, 3000),
      ])
      const vaultBurnTotal = vaultBurnEvents.reduce((sum, e) => sum + Number(ethers.formatEther((e as ethers.EventLog).args[2])), 0)
      const hoardBurnTotal = hoardBurnEvents.reduce((sum, e) => sum + Number(ethers.formatEther((e as ethers.EventLog).args[2])), 0)
      setSmaugVaultBurned(vaultBurnTotal)
      setSmaugHoardBurned(hoardBurnTotal)
    } catch (err) {
      console.error("[v0] Error fetching burn events:", err)
    }

    try {
      const roiRes = await fetch("/api/smaug-roi")
      if (roiRes.ok) {
        const roiData = await roiRes.json()
        await storeSmaugRoiSnapshot(roiData.currentBalance)
        const roiResult = await getSmaugRoi()
        if (roiResult.success) {
          setRoi24h(roiResult.roi24h)
          setRoi7d(roiResult.roi7d)
          setRoi30d(roiResult.roi30d)
        }
      }
    } catch (err) {
      console.error("[v0] Error fetching Smaug ROI:", err)
    }
  }

  useEffect(() => {
    const init = async () => {
      const prices = await fetchCachedPrices()
      try {
        await fetchSmaugVaultData(prices)
      } catch {}
      try {
        await fetchSmaugLPEvents()
      } catch {}
    }
    init()
  }, [])

  const refresh = async () => {
    setIsRefreshing(true)
    try {
      const prices = await fetchCachedPrices()
      await fetchSmaugVaultData(prices)
      await fetchSmaugLPEvents()
    } catch {}
    setIsRefreshing(false)
  }

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const roiColor = (v: number | null) =>
    v === null ? "text-[#9ca3af]" : v > 0 ? "text-[#4ade80]" : v < 0 ? "text-[#f87171]" : "text-[#9ca3af]"

  const vaultSmaugEquiv =
    smaugVaultPLS > 0 && plsPrice > 0 && smaugPrice > 0 ? (smaugVaultPLS * plsPrice) / smaugPrice : 0
  const hoardUsd = hoardData.pls * plsPrice + hoardData.pWbtc * hoardData.pWbtcPrice
  const hoardSmaugEquiv = hoardUsd > 0 && smaugPrice > 0 ? hoardUsd / smaugPrice : 0

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 md:px-6">
      <div className="mb-8 flex items-center justify-center gap-3">
        <span className="h-px w-10 bg-gradient-to-r from-transparent to-[#d4af37]/50" aria-hidden />
        <h2 className="text-center font-serif text-2xl font-bold text-[#e8e6e3] md:text-3xl">
          Smaug <span className="text-[#d4af37]">Hoard & Ledger</span>
        </h2>
        <span className="h-px w-10 bg-gradient-to-l from-transparent to-[#d4af37]/50" aria-hidden />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Tokenomics */}
        <div className="rounded-2xl border border-[#2a2a35] bg-[#0d0d12] p-7">
          <h3 className="mb-4 text-center font-serif text-xl font-semibold text-[#d4af37]">Tokenomics — 6.50%</h3>
          <ul className="space-y-2.5 font-sans text-sm text-[#b8b6b1]">
            <li className="flex justify-between"><span>Buy &amp; burn</span><span className="font-medium text-[#e8e6e3]">3.5%</span></li>
            <li className="flex justify-between"><span>Reflections to holders</span><span className="font-medium text-[#e8e6e3]">1.5%</span></li>
            <li className="flex justify-between"><span>Added to Smaug&apos;s Vault</span><span className="font-medium text-[#e8e6e3]">1.0%</span></li>
            <li className="flex justify-between"><span>Added to burned LP</span><span className="font-medium text-[#e8e6e3]">0.5%</span></li>
          </ul>
          {smaugLpPls && (
            <div className="mt-4 text-center font-sans text-xs text-[#7c7a76]">
              Burned PLS added: {formatMillions(smaugLpPls)}
            </div>
          )}
        </div>

        {/* Ledger: price / market cap / liquidity / ROI */}
        <div className="rounded-2xl border border-[#2a2a35] bg-[#0d0d12] p-7">
          <div className="mb-4 flex items-center justify-center gap-2">
            <h3 className="font-serif text-xl font-semibold text-[#d4af37]">Smaug&apos;s Ledger</h3>
            <button type="button" onClick={refresh} title="Refresh data" className="cursor-pointer">
              <RefreshCw className={`h-3.5 w-3.5 text-[#9ca3af] transition-colors hover:text-[#d4af37] ${isRefreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
          <ul className="space-y-3 font-sans text-sm text-[#b8b6b1]">
            <li className="flex justify-between"><span>Total Supply</span><span className="font-medium text-[#e8e6e3]">1,000,000,000</span></li>
            <li className="flex justify-between">
              <span>Smaug Burned</span>
              <span className="font-medium text-[#e8e6e3]">
                {smaugTotalBurned > 0 ? `${smaugTotalBurned.toLocaleString(undefined, { maximumFractionDigits: 0 })} (${((smaugTotalBurned / 1_000_000_000) * 100).toFixed(2)}%)` : "--"}
              </span>
            </li>
            <li className="flex justify-between">
              <span>Circulating Supply</span>
              <span className="font-medium text-[#e8e6e3]">
                {smaugTotalBurned > 0 ? (1_000_000_000 - smaugTotalBurned).toLocaleString(undefined, { maximumFractionDigits: 0 }) : "--"}
              </span>
            </li>
            <li className="flex justify-between"><span>Price</span><span className="font-medium text-[#e8e6e3]">{smaugPrice > 0 ? `$${smaugPrice.toFixed(6)}` : "--"}</span></li>
            <li className="flex justify-between"><span>Market Cap</span><span className="font-medium text-[#e8e6e3]">{smaugMarketCap > 0 ? `$${smaugMarketCap.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "--"}</span></li>
            <li className="flex justify-between"><span>Liquidity</span><span className="font-medium text-[#e8e6e3]">{smaugLiquidity > 0 ? `$${smaugLiquidity.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "--"}</span></li>
            <li className="flex justify-between"><span>24h ROI</span><span className={`font-medium ${roiColor(roi24h)}`}>{roi24h !== null ? `${roi24h.toFixed(4)}%` : "--"}</span></li>
            {roi7d !== null && <li className="flex justify-between"><span>7d ROI</span><span className={`font-medium ${roiColor(roi7d)}`}>{roi7d.toFixed(4)}%</span></li>}
            {roi30d !== null && <li className="flex justify-between"><span>30d ROI</span><span className={`font-medium ${roiColor(roi30d)}`}>{roi30d.toFixed(4)}%</span></li>}
          </ul>
        </div>

        {/* Smaug's Vault */}
        <div className="rounded-2xl border border-[#2a2a35] bg-[#0d0d12] p-7">
          <div className="mb-2 flex items-center justify-center gap-2">
            <h3 className="font-serif text-xl font-semibold text-[#d4af37]">Smaug&apos;s Vault</h3>
            <button type="button" onClick={() => copy(SMAUG_VAULT_ADDRESS, "vault")} title="Copy the address" className="rounded p-1 transition-colors hover:bg-[#2a2a35]">
              {copied === "vault" ? <Check className="h-4 w-4 text-[#4ade80]" /> : <Copy className="h-4 w-4 text-[#9ca3af] hover:text-[#d4af37]" />}
            </button>
          </div>
          <p className="mb-5 text-center font-sans text-sm text-[#9ca3af]">
            PLS in Smaug&apos;s vault is exclusively used to buy Smaug on 10–25% drawdowns and permanently burn them.
          </p>
          <ul className="space-y-3 font-sans text-sm text-[#b8b6b1]">
            <li>
              <div className="flex justify-between">
                <span>Ready-to-deploy buy &amp; burn</span>
                <span className="font-medium text-[#4ade80]">{vaultSmaugEquiv > 0 ? `${vaultSmaugEquiv.toLocaleString(undefined, { maximumFractionDigits: 0 })} Smaug` : "--"}</span>
              </div>
              {vaultSmaugEquiv > 0 && <div className="mt-0.5 text-right text-xs text-[#7c7a76]">({((vaultSmaugEquiv / 1_000_000_000) * 100).toFixed(3)}% of total supply)</div>}
            </li>
            <li className="border-t border-[#2a2a35] pt-3">
              <div className="mb-1 flex justify-between"><span>PLS balance</span><span className="font-medium text-[#e8e6e3]">{smaugVaultPLS > 0 ? smaugVaultPLS.toLocaleString(undefined, { maximumFractionDigits: 0 }) : "--"}</span></div>
              <div className="flex justify-between text-xs text-[#7c7a76]"><span>Value</span><span>{smaugVaultPLS > 0 && plsPrice > 0 ? `$${(smaugVaultPLS * plsPrice).toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "--"}</span></div>
            </li>
            <li>
              <div className="flex justify-between">
                <span>Bought &amp; burned to date</span>
                <span className="font-medium text-[#4ade80]">{smaugVaultBurned > 0 ? (smaugVaultBurned + 2_495_267).toLocaleString(undefined, { maximumFractionDigits: 0 }) : "--"}</span>
              </div>
              {smaugVaultBurned > 0 && <div className="mt-0.5 text-right text-xs text-[#7c7a76]">({(((smaugVaultBurned + 2_495_267) / 1_000_000_000) * 100).toFixed(3)}% of total supply)</div>}
            </li>
          </ul>
        </div>

        {/* Smaug's Hoard Wallet */}
        <div className="rounded-2xl border border-[#2a2a35] bg-[#0d0d12] p-7">
          <div className="mb-2 flex items-center justify-center gap-2">
            <h3 className="font-serif text-xl font-semibold text-[#d4af37]">Smaug&apos;s Hoard Wallet</h3>
            <button type="button" onClick={() => copy(SMAUG_HOARD_ADDRESS, "hoard")} title="Copy the address" className="rounded p-1 transition-colors hover:bg-[#2a2a35]">
              {copied === "hoard" ? <Check className="h-4 w-4 text-[#4ade80]" /> : <Copy className="h-4 w-4 text-[#9ca3af] hover:text-[#d4af37]" />}
            </button>
          </div>
          <p className="mb-5 text-center font-sans text-sm text-[#9ca3af]">
            Smaug&apos;s hoard of assorted yield-generating distributor tokens. All yield is used to buy and burn Smaug.
          </p>
          <ul className="space-y-3 font-sans text-sm text-[#b8b6b1]">
            <li>
              <div className="flex justify-between">
                <span>Ready-to-deploy buy &amp; burn</span>
                <span className="font-medium text-[#4ade80]">{hoardSmaugEquiv > 0 ? `${hoardSmaugEquiv.toLocaleString(undefined, { maximumFractionDigits: 0 })} Smaug` : "--"}</span>
              </div>
              {hoardSmaugEquiv > 0 && <div className="mt-0.5 text-right text-xs text-[#7c7a76]">({((hoardSmaugEquiv / 1_000_000_000) * 100).toFixed(3)}% of total supply)</div>}
            </li>
            <li className="border-t border-[#2a2a35] pt-3">
              <div className="mb-1 flex justify-between"><span>PLS</span><span className="font-medium text-[#e8e6e3]">{hoardData.pls > 0 ? hoardData.pls.toLocaleString(undefined, { maximumFractionDigits: 0 }) : "--"}</span></div>
              <div className="flex justify-between text-xs text-[#7c7a76]"><span>Value</span><span>{hoardData.pls > 0 && plsPrice > 0 ? `$${(hoardData.pls * plsPrice).toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "--"}</span></div>
            </li>
            <li className="border-t border-[#2a2a35] pt-3">
              <div className="mb-1 flex justify-between"><span>pWBTC</span><span className="font-medium text-[#e8e6e3]">{hoardData.pWbtc > 0 ? hoardData.pWbtc.toLocaleString(undefined, { maximumFractionDigits: 3 }) : "--"}</span></div>
              <div className="flex justify-between text-xs text-[#7c7a76]"><span>Value</span><span>{hoardData.pWbtc > 0 && hoardData.pWbtcPrice > 0 ? `$${(hoardData.pWbtc * hoardData.pWbtcPrice).toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "--"}</span></div>
            </li>
            <li className="border-t border-[#2a2a35] pt-3">
              <div className="flex justify-between">
                <span>Bought &amp; burned to date</span>
                <span className="font-medium text-[#4ade80]">{smaugHoardBurned > 0 ? smaugHoardBurned.toLocaleString(undefined, { maximumFractionDigits: 0 }) : "--"}</span>
              </div>
              {smaugHoardBurned > 0 && <div className="mt-0.5 text-right text-xs text-[#7c7a76]">({((smaugHoardBurned / 1_000_000_000) * 100).toFixed(3)}% of total supply)</div>}
            </li>
          </ul>
        </div>
      </div>

      {/* Lonely Mountain Reserve */}
      <div className="mt-6 rounded-2xl border border-[#2a2a35] bg-[#0d0d12] p-7">
        <h3 className="mb-3 flex items-center justify-center gap-2 font-serif text-xl font-semibold text-[#d4af37]">
          <Mountain className="h-5 w-5" /> The Lonely Mountain Reserve
        </h3>
        <p className="mx-auto max-w-3xl text-center font-sans text-sm leading-relaxed text-[#b8b6b1]">
          This reserve holds an assortment of tokens. When tokens in this reserve hit certain thresholds, they will be deployed to incrementally buy Smaug and burn them — removing even more from circulation.
        </p>
      </div>
    </section>
  )
}
