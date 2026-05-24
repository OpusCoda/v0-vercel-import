import { storeOpusRoiSnapshot } from "@/app/actions"

const OPUS_CONTRACT = "0x9B5a65E37f338ADD1263530DDac8CEc56204bB3a"
const ROI_WALLET = "0xB1B7847969C2c62A6fCbC1fED52176aBAc0b9300"
const OPUS_PAIR = "0x15dD01082095F1234f48AC920997621D66687972"
const PLS_PAIR  = "0x6753560538ECa67617A9Ce605178F788bE7E524E"

function encodeGetTotalPlsEarned(address: string): string {
  const selector = "7312e419"
  const paddedAddress = address.slice(2).toLowerCase().padStart(64, "0")
  return `0x${selector}${paddedAddress}`
}

async function fetchPrice(pairAddress: string): Promise<number> {
  const res = await fetch(`https://api.dexscreener.com/latest/dex/pairs/pulsechain/${pairAddress}`)
  const data = await res.json() as { pair?: { priceUsd?: string } }
  return parseFloat(data.pair?.priceUsd ?? "0")
}

export async function GET() {
  try {
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.pulsechain.com"

    const [rpcRes, opusPriceUsd, plsPriceUsd] = await Promise.all([
      fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_call",
          params: [{ to: OPUS_CONTRACT, data: encodeGetTotalPlsEarned(ROI_WALLET) }, "latest"],
          id: 1,
        }),
      }),
      fetchPrice(OPUS_PAIR),
      fetchPrice(PLS_PAIR),
    ])

    const data = await rpcRes.json() as { result: string }
    const rawEarned = BigInt(data.result)
    const wholePart = rawEarned / BigInt(1e18)
    const fracPart = rawEarned % BigInt(1e18)
    const plsEarned = Number(wholePart) + Number(fracPart) / 1e18

    await storeOpusRoiSnapshot(plsEarned, opusPriceUsd, plsPriceUsd)

    return Response.json({ success: true, plsEarned, opusPriceUsd, plsPriceUsd, timestamp: new Date() })
  } catch (error) {
    console.error("[v0] Opus ROI cron error:", error)
    return Response.json({ error: "Failed to store Opus ROI snapshot" }, { status: 500 })
  }
}
