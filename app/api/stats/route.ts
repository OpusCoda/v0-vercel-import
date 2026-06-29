// Server-side on-chain stats cache.
// Heavy RPC work (balances, totals, event scans) runs once on the server and is
// cached for ~45s. The CDN `stale-while-revalidate` header means every visitor
// gets an instant cached response while the cache refreshes in the background.

import { ethers } from "ethers"
import {
  OPUS_CONTRACT,
  CODA_CONTRACT,
  CODA_DISTRIBUTORS,
  SMAUG_ADDRESS,
  PWBTC_ADDRESS,
  FINVESTA_ADDRESS,
  MISSOR_ADDRESS,
  WGPP_ADDRESS,
  SMAUG_VAULT_ADDRESS,
  SMAUG_HOARD_ADDRESS,
  BURN_ADDRESS,
  OPUS_ABI,
  DISTRIBUTOR_ABI,
  SMAUG_ABI,
  BALANCE_ABI,
  getProvider,
  rpcRetry,
} from "@/lib/onchain"

interface StatsData {
  plsDistributed: number
  plsxDistributed: number
  smaugBurned: number
  smaugVaultPLS: number
  smaugVaultBurned: number
  smaugHoardPLS: number
  smaugHoardPWbtc: number
  smaugHoardBurned: number
  smaugLpPls: number
}

const CACHE_TTL = 45_000 // 45 seconds
const cache: { data: StatsData | null; timestamp: number } = { data: null, timestamp: 0 }

async function fetchPlsDistributed(provider: ethers.JsonRpcProvider): Promise<number> {
  const opus = new ethers.Contract(OPUS_CONTRACT, OPUS_ABI, provider)
  const plsVal = await rpcRetry(() => opus.getTotalPlsDistributed(), 1, 2000)
  let totalPls = Number(ethers.formatUnits(plsVal, 18))

  const scale = BigInt("10000000000000000000000")
  const fmtPrinter = (raw: bigint) => {
    const whole = raw / scale
    const frac = (raw % scale).toString().padStart(22, "0")
    return Number.parseFloat(`${whole}.${frac}`)
  }
  const [finvesta, missor, wgpp] = await Promise.all([
    rpcRetry(() => opus.getTotalPlsEarned(FINVESTA_ADDRESS), 1, 2000),
    rpcRetry(() => opus.getTotalPlsEarned(MISSOR_ADDRESS), 1, 2000),
    rpcRetry(() => opus.getTotalPlsEarned(WGPP_ADDRESS), 1, 2000),
  ])
  totalPls +=
    fmtPrinter(BigInt(finvesta.toString())) +
    fmtPrinter(BigInt(missor.toString())) +
    fmtPrinter(BigInt(wgpp.toString()))
  return totalPls
}

async function fetchPlsxDistributed(provider: ethers.JsonRpcProvider): Promise<number> {
  let totalPlsx = 0n
  const results = await Promise.allSettled(
    CODA_DISTRIBUTORS.map((address) => {
      const contract = new ethers.Contract(address, DISTRIBUTOR_ABI, provider)
      return rpcRetry(() => contract.totalPlsxDistributed(), 1, 2000).then((v) => BigInt(v))
    }),
  )
  for (const r of results) if (r.status === "fulfilled") totalPlsx += r.value

  try {
    const newCodaPlsx = await rpcRetry(() => provider.call({ to: CODA_CONTRACT, data: "0x775b2dfa" }), 1, 2000)
    if (newCodaPlsx && newCodaPlsx !== "0x") totalPlsx += BigInt(newCodaPlsx)
  } catch (e) {
    console.error("[stats] Error fetching new Coda PLSX:", e)
  }
  return Number(ethers.formatUnits(totalPlsx, 18))
}

async function fetchSmaugBurned(smaug: ethers.Contract): Promise<number> {
  let burned
  try {
    burned = await rpcRetry(() => smaug.totalBurned())
  } catch {
    burned = await rpcRetry(() => smaug.balanceOf(BURN_ADDRESS))
  }
  return Number(ethers.formatEther(burned))
}

async function fetchAllStats(): Promise<StatsData> {
  const provider = getProvider()
  const smaug = new ethers.Contract(SMAUG_ADDRESS, SMAUG_ABI, provider)
  const pWbtc = new ethers.Contract(PWBTC_ADDRESS, BALANCE_ABI, provider)

  const [
    plsDistributed,
    plsxDistributed,
    smaugBurned,
    vaultPlsBal,
    hoardPlsBal,
    hoardPWbtcBal,
  ] = await Promise.all([
    fetchPlsDistributed(provider).catch((e) => {
      console.error("[stats] PLS distributed failed:", e)
      return 0
    }),
    fetchPlsxDistributed(provider).catch((e) => {
      console.error("[stats] PLSX distributed failed:", e)
      return 0
    }),
    fetchSmaugBurned(smaug).catch((e) => {
      console.error("[stats] Smaug burned failed:", e)
      return 0
    }),
    rpcRetry(() => provider.getBalance(SMAUG_VAULT_ADDRESS)).catch(() => 0n),
    rpcRetry(() => provider.getBalance(SMAUG_HOARD_ADDRESS)).catch(() => 0n),
    rpcRetry(() => pWbtc.balanceOf(SMAUG_HOARD_ADDRESS)).catch(() => 0n),
  ])

  // Event scans (heavier) — buy & burn history + LP added
  let smaugVaultBurned = 0
  let smaugHoardBurned = 0
  let smaugLpPls = 0
  try {
    const transferFilter = smaug.filters.Transfer
    const lpFilter = smaug.filters.LPAdded()
    const [vaultBurnEvents, hoardBurnEvents, lpEvents] = await Promise.all([
      rpcRetry(() => smaug.queryFilter(transferFilter(SMAUG_VAULT_ADDRESS, BURN_ADDRESS)), 2, 3000),
      rpcRetry(() => smaug.queryFilter(transferFilter(SMAUG_HOARD_ADDRESS, BURN_ADDRESS)), 2, 3000),
      rpcRetry(() => smaug.queryFilter(lpFilter, 0, "latest"), 2, 3000),
    ])
    smaugVaultBurned = vaultBurnEvents.reduce(
      (sum, e) => sum + Number(ethers.formatEther((e as ethers.EventLog).args[2])),
      0,
    )
    smaugHoardBurned = hoardBurnEvents.reduce(
      (sum, e) => sum + Number(ethers.formatEther((e as ethers.EventLog).args[2])),
      0,
    )
    let totalLpPls = 0n
    for (const event of lpEvents) totalLpPls += BigInt((event as ethers.EventLog).args[1])
    smaugLpPls = Number(ethers.formatUnits(totalLpPls, 18))
  } catch (e) {
    console.error("[stats] Event scan failed:", e)
  }

  return {
    plsDistributed,
    plsxDistributed,
    smaugBurned,
    smaugVaultPLS: Number(ethers.formatEther(vaultPlsBal)),
    smaugVaultBurned,
    smaugHoardPLS: Number(ethers.formatEther(hoardPlsBal)),
    smaugHoardPWbtc: Number(ethers.formatUnits(hoardPWbtcBal, 8)),
    smaugHoardBurned,
    smaugLpPls,
  }
}

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=45, stale-while-revalidate=300",
}

export async function GET() {
  const now = Date.now()

  if (cache.data && now - cache.timestamp < CACHE_TTL) {
    return Response.json(
      { ...cache.data, cached: true, age: Math.round((now - cache.timestamp) / 1000) },
      { headers: CACHE_HEADERS },
    )
  }

  try {
    console.log("[stats] Fetching fresh on-chain stats...")
    const data = await fetchAllStats()
    cache.data = data
    cache.timestamp = now
    return Response.json({ ...data, cached: false, age: 0 }, { headers: CACHE_HEADERS })
  } catch (err) {
    console.error("[stats] Failed to fetch stats:", err)
    if (cache.data) {
      return Response.json(
        { ...cache.data, cached: true, stale: true, age: Math.round((now - cache.timestamp) / 1000) },
        { headers: CACHE_HEADERS },
      )
    }
    return Response.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
