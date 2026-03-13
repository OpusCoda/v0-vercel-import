import { ethers } from "ethers"

const SMAUG_ADDRESS = "0xf4754Aa585caBf38537A68660469A17E203D8632"
const ROI_WALLET = "0xB1B7847969C2c62A6fCbC1fED52176aBAc0b9300"
const INITIAL_BALANCE = 1_000_000n // 1 million Smaug

const BALANCE_ABI = ["function balanceOf(address) public view returns (uint256)"]

export async function GET() {
  try {
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.pulsechain.com"
    const provider = new ethers.JsonRpcProvider(rpcUrl)

    // Fetch current balance
    const contract = new ethers.Contract(SMAUG_ADDRESS, BALANCE_ABI, provider)
    const balance = await contract.balanceOf(ROI_WALLET)
    const currentBalance = Number(ethers.formatEther(balance))

    // Store snapshot in database
    const timestamp = new Date()
    try {
      await fetch(new URL("/api/db-snapshot", process.env.VERCEL_URL || "http://localhost:3000"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timestamp,
          balance: currentBalance,
        }),
      })
    } catch (e) {
      console.log("[v0] Failed to store snapshot (expected if no DB access):", e)
    }

    // Calculate 24h ROI if we have historical data
    let roi24h = 0
    try {
      const res = await fetch(new URL("/api/db-snapshot", process.env.VERCEL_URL || "http://localhost:3000"), {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })
      if (res.ok) {
        const data = (await res.json()) as { balance: number; timestamp: string }
        const snapshot24hAgo = data
        const roi24h_calc = ((currentBalance - snapshot24hAgo.balance) / snapshot24hAgo.balance) * 100
        roi24h = roi24h_calc
      }
    } catch (e) {
      console.log("[v0] No 24h snapshot available yet")
    }

    return Response.json({
      currentBalance,
      initialBalance: INITIAL_BALANCE.toString(),
      roi24h,
      totalROI: ((currentBalance - Number(ethers.formatEther(INITIAL_BALANCE))) / Number(ethers.formatEther(INITIAL_BALANCE))) * 100,
      timestamp,
    })
  } catch (error) {
    console.error("[v0] Error fetching SMAUG ROI:", error)
    return Response.json({ error: "Failed to fetch ROI data" }, { status: 500 })
  }
}
