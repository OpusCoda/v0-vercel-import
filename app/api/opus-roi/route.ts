const OPUS_CONTRACT = "0x9B5a65E37f338ADD1263530DDac8CEc56204bB3a"
const ROI_WALLET = "0xB1B7847969C2c62A6fCbC1fED52176aBAc0b9300"

// getTotalPlsEarned(address) selector
function encodeGetTotalPlsEarned(address: string): string {
  const selector = "7312e419"
  const paddedAddress = address.slice(2).toLowerCase().padStart(64, "0")
  return `0x${selector}${paddedAddress}`
}

export async function GET() {
  try {
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.pulsechain.com"

    const res = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_call",
        params: [{ to: OPUS_CONTRACT, data: encodeGetTotalPlsEarned(ROI_WALLET) }, "latest"],
        id: 1,
      }),
    })

    const data = await res.json() as { result: string }
    const rawEarned = BigInt(data.result)
    // PLS has 18 decimals — divide in BigInt to avoid float precision loss
    const wholePart = rawEarned / BigInt(1e18)
    const fracPart = rawEarned % BigInt(1e18)
    const plsEarned = Number(wholePart) + Number(fracPart) / 1e18

    return Response.json({
      plsEarned,
      wallet: ROI_WALLET,
      timestamp: new Date(),
    })
  } catch (error) {
    console.error("[v0] Error fetching Opus PLS earned:", error)
    return Response.json({ error: "Failed to fetch Opus ROI data" }, { status: 500 })
  }
}
