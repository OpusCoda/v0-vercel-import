import { storeCodaRoiSnapshot } from "@/app/actions"

const DIST_V3 = "0x2924Dc56bb4eeF50d0d32D8aCD6AA7c61aFa5dfe"
const ROI_WALLET = "0xB1B7847969C2c62A6fCbC1fED52176aBAc0b9300"
const RPC_URL = "https://rpc.pulsechain.com"

// shares(address) selector: 0xce7c2ac2
function encodeShares(address: string): string {
  const selector = "ce7c2ac2"
  const paddedAddress = address.slice(2).toLowerCase().padStart(64, "0")
  return `0x${selector}${paddedAddress}`
}

async function ethCall(to: string, data: string): Promise<string> {
  const res = await fetch(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0", method: "eth_call",
      params: [{ to, data }, "latest"],
      id: 1,
    }),
  })
  const json = await res.json() as { result: string }
  return json.result
}

async function fetchPrice(pairAddress: string): Promise<number> {
  const res = await fetch(`https://api.dexscreener.com/latest/dex/pairs/pulsechain/${pairAddress}`)
  const json = await res.json() as { pair?: { priceUsd?: string } }
  return parseFloat(json.pair?.priceUsd ?? "0") || 0
}

function decodeUint256(hex: string, offset: number): bigint {
  const slice = hex.slice(2 + offset * 64, 2 + (offset + 1) * 64)
  return BigInt("0x" + slice)
}

function safeDivide(raw: bigint, decimals: number): number {
  const whole = raw / BigInt(10 ** decimals)
  const frac = raw % BigInt(10 ** decimals)
  return Number(whole) + Number(frac) / (10 ** decimals)
}

export async function GET() {
  try {
    // Fetch shares from DIST_V3
    const result = await ethCall(DIST_V3, encodeShares(ROI_WALLET))
    // struct: [amount, wethExcluded, wethRealised, pWbtcExcluded, pWbtcRealised, plsxExcluded, plsxRealised]
    const wethRaw  = decodeUint256(result, 2)
    const pwbtcRaw = decodeUint256(result, 4)
    const plsxRaw  = decodeUint256(result, 6)

    const wethEarned  = safeDivide(wethRaw,  18)
    const pwbtcEarned = safeDivide(pwbtcRaw, 8)
    const plsxEarned  = safeDivide(plsxRaw,  18)

    // Fetch token prices
    const [wethPrice, pwbtcPrice, plsxPrice] = await Promise.all([
      fetchPrice("0x6b0956258ff7bd7645aa35369b55b61b8e6d6140"), // WETH/PLS pair
      fetchPrice("0x0f0fc5a5029e3d155708356b422d22cc29f8b3d4"), // pWBTC/PLS pair
      fetchPrice("0x6753560538eca67617a9ce605178f788be7e524e"), // PLSX/PLS pair
    ])

    const usdValue = (wethEarned * wethPrice) + (pwbtcEarned * pwbtcPrice) + (plsxEarned * plsxPrice)

    await storeCodaRoiSnapshot(wethEarned, pwbtcEarned, plsxEarned, usdValue)

    return Response.json({ success: true, wethEarned, pwbtcEarned, plsxEarned, usdValue, timestamp: new Date() })
  } catch (error) {
    console.error("[v0] Coda ROI cron error:", error)
    return Response.json({ error: "Failed to store Coda ROI snapshot" }, { status: 500 })
  }
}
