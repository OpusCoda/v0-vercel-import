const SMAUG_ADDRESS = "0xf4754Aa585caBf38537A68660469A17E203D8632"
const ROI_WALLET = "0xB1B7847969C2c62A6fCbC1fED52176aBAc0b9300"
const INITIAL_BALANCE = 1_000_000 // 1 million Smaug

// Encode balanceOf(address) call using raw hex
function encodeBalanceOf(address: string): string {
  // keccak256("balanceOf(address)") = 0x70a08231
  const selector = "70a08231"
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
        params: [{ to: SMAUG_ADDRESS, data: encodeBalanceOf(ROI_WALLET) }, "latest"],
        id: 1,
      }),
    })

    const data = await res.json() as { result: string }
    const rawBalance = BigInt(data.result)
    // Smaug has 18 decimals
    const currentBalance = Number(rawBalance) / 1e18

    const totalROI = ((currentBalance - INITIAL_BALANCE) / INITIAL_BALANCE) * 100

    return Response.json({
      currentBalance,
      initialBalance: INITIAL_BALANCE.toString(),
      totalROI,
      timestamp: new Date(),
    })
  } catch (error) {
    console.error("[v0] Error fetching SMAUG ROI:", error)
    return Response.json({ error: "Failed to fetch ROI data" }, { status: 500 })
  }
}
