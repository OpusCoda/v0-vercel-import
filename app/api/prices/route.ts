// Server-side price cache — fetches DexScreener at most once per 60 seconds
// All visitors get the cached result instantly

interface PriceCache {
  data: PriceData | null
  timestamp: number
}

interface PriceData {
  // Token prices (pairs endpoint returns .pair)
  pls: number
  smaug: number
  smaugMarketCap: number
  smaugLiquidity: number
  missor: number
  finvesta: number
  wgpp: number
  weth: number
  pwbtc: number
  plsx: number
  opus: number
  coda: number
  hexPulsechain: number
  hexEthereum: number
  inc: number
  // Token prices (tokens endpoint returns .pairs[])
  gasMoney: number
  dominance: number
  // Liquidity data (from RPC)
  liquidityOpusAdded: string
  liquidityOpusPlsAdded: string
  liquidityCodaAdded: string
  liquidityCodaPlsAdded: string
}

const CACHE_TTL = 60_000 // 60 seconds
const cache: PriceCache = { data: null, timestamp: 0 }

// All DexScreener endpoints we need, categorized by response format
const PAIR_ENDPOINTS: Array<{ key: keyof PriceData; url: string; extra?: string[] }> = [
  { key: "pls", url: "https://api.dexscreener.com/latest/dex/pairs/pulsechain/0xe56043671df55de5cdf8459710433c10324de0ae" },
  {
    key: "smaug",
    url: "https://api.dexscreener.com/latest/dex/pairs/pulsechain/0x151e583badb57138d41aa964ac3ff38d4bb1145f",
    extra: ["smaugMarketCap", "smaugLiquidity"],
  },
  { key: "missor", url: "https://api.dexscreener.com/latest/dex/pairs/pulsechain/0xf3a8541894e4d789e6257a63440094d698d82bad" },
  { key: "finvesta", url: "https://api.dexscreener.com/latest/dex/pairs/pulsechain/0x615cfd552e98eb97e5557b03aa41d0e85e98167b" },
  { key: "wgpp", url: "https://api.dexscreener.com/latest/dex/pairs/pulsechain/0xf13ca5c98d9aae6294edb9e7299b0bbe1e71265d" },
  { key: "weth", url: "https://api.dexscreener.com/latest/dex/pairs/pulsechain/0x42abdfdb63f3282033c766e72cc4810738571609" },
  { key: "pwbtc", url: "https://api.dexscreener.com/latest/dex/pairs/pulsechain/0xe0e1f83a1c64cf65c1a86d7f3445fc4f58f7dcbf" },
  { key: "plsx", url: "https://api.dexscreener.com/latest/dex/pairs/pulsechain/0x1b45b9148791d3a104184cd5dfe5ce57193a3ee9" },
  { key: "opus", url: "https://api.dexscreener.com/latest/dex/pairs/pulsechain/0x14495adf3e689221655fdc950cd0133051ec61f9" },
  { key: "coda", url: "https://api.dexscreener.com/latest/dex/pairs/pulsechain/0x13b62b75cfa35814d30fbeec0682047aa6287dfb" },
  { key: "hexPulsechain", url: "https://api.dexscreener.com/latest/dex/pairs/pulsechain/0xf1f4ee610b2babb05c635f726ef8b0c568c8dc65" },
  { key: "hexEthereum", url: "https://api.dexscreener.com/latest/dex/pairs/ethereum/0x55d5c232d921b9eaa6b37b5845e439acd04b4dba" },
  { key: "inc", url: "https://api.dexscreener.com/latest/dex/pairs/pulsechain/0xf808bb6265e9ca27002c0a04562bf50d4fe37eaa" },
]

const TOKEN_ENDPOINTS: Array<{ key: keyof PriceData; url: string }> = [
  { key: "gasMoney", url: "https://api.dexscreener.com/latest/dex/tokens/0x042b48a98B37042D58Bc8defEEB7cA4eC76E6106" },
  { key: "dominance", url: "https://api.dexscreener.com/latest/dex/tokens/0x116D162d729E27E2E1D6478F1d2A8AEd9C7a2beA" },
]

async function fetchWithRetry(url: string, retries = 2): Promise<any> {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, { cache: "no-store" })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (err) {
      if (i === retries) throw err
      await new Promise((r) => setTimeout(r, 500 * (i + 1)))
    }
  }
}

async function fetchAllPrices(): Promise<PriceData> {
  const result: PriceData = {
    pls: 0, smaug: 0, smaugMarketCap: 0, smaugLiquidity: 0,
    missor: 0, finvesta: 0, wgpp: 0, weth: 0, pwbtc: 0,
    plsx: 0, opus: 0, coda: 0, hexPulsechain: 0, hexEthereum: 0,
    inc: 0, gasMoney: 0, dominance: 0,
    liquidityOpusAdded: "0", liquidityOpusPlsAdded: "0",
    liquidityCodaAdded: "0", liquidityCodaPlsAdded: "0",
  }

  // Fetch in batches of 4 to avoid rate limiting
  const allEndpoints = [
    ...PAIR_ENDPOINTS.map((e) => ({ ...e, type: "pair" as const })),
    ...TOKEN_ENDPOINTS.map((e) => ({ ...e, type: "token" as const, extra: undefined })),
  ]

  for (let i = 0; i < allEndpoints.length; i += 4) {
    const batch = allEndpoints.slice(i, i + 4)
    const results = await Promise.allSettled(batch.map((e) => fetchWithRetry(e.url)))

    for (let j = 0; j < batch.length; j++) {
      const endpoint = batch[j]
      const res = results[j]
      if (res.status !== "fulfilled") {
        console.error(`[prices] Failed to fetch ${endpoint.key}:`, res.reason)
        continue
      }

      const data = res.value
      // Handle both response formats: { pair: {...} } and { pairs: [...] }
      const pairData = data?.pair || data?.pairs?.[0]
      if (pairData?.priceUsd) {
        result[endpoint.key] = Number(pairData.priceUsd)
      }
      // Extract extra Smaug data
      if (endpoint.key === "smaug" && pairData) {
        const mc = pairData.marketCap || pairData.fdv
        if (mc) result.smaugMarketCap = Number(mc)
        const liq = pairData.liquidity?.usd
        if (liq) result.smaugLiquidity = Number(liq)
      }
    }

    // Small delay between batches
    if (i + 4 < allEndpoints.length) {
      await new Promise((r) => setTimeout(r, 300))
    }
  }

  // Also fetch liquidity data from PulseChain RPC (server-side, cached)
  const rpcUrl = process.env.RPC_URL || process.env.NEXT_PUBLIC_RPC_URL
  if (rpcUrl) {
    const OPUS_CONTRACT = "0x3d1e671B4486314f9cD3827f3F3D80B2c6D46FB4"
    const CODA_CONTRACT = "0xC67E1E5F535bDDF5d0CEFaA9b7ed2A170f654CD7"
    try {
      const rpcCall = async (to: string, data: string) => {
        const res = await fetch(rpcUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", method: "eth_call", params: [{ to, data }, "latest"], id: 1 }),
          cache: "no-store",
        })
        const json = await res.json()
        return json.result || "0x0"
      }
      const [opusLp, opusPlsLp, codaLp, codaPlsLp] = await Promise.all([
        rpcCall(OPUS_CONTRACT, "0x77e34bcf"),
        rpcCall(OPUS_CONTRACT, "0x2f6ec43a"),
        rpcCall(CODA_CONTRACT, "0x2af2db78"),
        rpcCall(CODA_CONTRACT, "0x2f6ec43a"),
      ])
      result.liquidityOpusAdded = opusLp
      result.liquidityOpusPlsAdded = opusPlsLp
      result.liquidityCodaAdded = codaLp
      result.liquidityCodaPlsAdded = codaPlsLp
      console.log("[prices] Liquidity data fetched from RPC")
    } catch (err) {
      console.error("[prices] Failed to fetch liquidity data from RPC:", err)
    }
  }

  return result
}

export async function GET() {
  const now = Date.now()

  // Return cached data if fresh
  if (cache.data && now - cache.timestamp < CACHE_TTL) {
    return Response.json({
      ...cache.data,
      cached: true,
      age: Math.round((now - cache.timestamp) / 1000),
    })
  }

  try {
    console.log("[prices] Fetching fresh prices from DexScreener...")
    const data = await fetchAllPrices()
    console.log("[prices] Fetched prices:", JSON.stringify({ smaug: data.smaug, pls: data.pls, missor: data.missor, finvesta: data.finvesta, opus: data.opus, coda: data.coda }))
    cache.data = data
    cache.timestamp = now

    return Response.json({ ...data, cached: false, age: 0 })
  } catch (err) {
    console.error("[prices] Failed to fetch prices:", err)
    // Return stale cache if available
    if (cache.data) {
      return Response.json({
        ...cache.data,
        cached: true,
        stale: true,
        age: Math.round((now - cache.timestamp) / 1000),
      })
    }
    return Response.json({ error: "Failed to fetch prices" }, { status: 500 })
  }
}
