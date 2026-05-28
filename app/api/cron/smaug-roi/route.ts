import { storeSmaugRoiSnapshot } from "@/app/actions"

const VAULT_ADDRESS = "0xD1fB678aB14429140c06AfFFCC878F9c41F48787"
const RPC_URL = "https://rpc.pulsechain.com"

export async function GET(request: Request) {
  try {
    const baseUrl = new URL(request.url).origin

    const [balanceRes, pricesRes] = await Promise.all([
      fetch(RPC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_getBalance",
          params: [VAULT_ADDRESS, "latest"],
          id: 1,
        }),
      }),
      fetch(`${baseUrl}/api/prices`, { cache: "no-store" }),
    ])

    const balanceData = await balanceRes.json() as { result: string }
    const rawBalance = BigInt(balanceData.result)
    const divisor = BigInt("1000000000000000000")
    const whole = rawBalance / divisor
    const frac = (rawBalance % divisor).toString().padStart(18, "0")
    const vaultPlsBalance = parseFloat(`${whole}.${frac}`)

    const prices = await pricesRes.json() as { smaug?: number; pls?: number }
    const smaugPriceUsd = prices.smaug ?? 0
    const plsPriceUsd = prices.pls ?? 0

    await storeSmaugRoiSnapshot(vaultPlsBalance, smaugPriceUsd, plsPriceUsd)

    return Response.json({ success: true, vaultPlsBalance, smaugPriceUsd, plsPriceUsd, timestamp: new Date() })
  } catch (error) {
    console.error("[v0] Smaug ROI cron error:", error)
    return Response.json({ error: "Failed to store Smaug ROI snapshot" }, { status: 500 })
  }
}
