import { ethers } from "ethers"
import { sql } from "@vercel/postgres"

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
      await sql`
        INSERT INTO smaug_roi_snapshots (balance, timestamp)
        VALUES (${currentBalance}, ${timestamp})
      `
    } catch (e) {
      console.log("[v0] Failed to store snapshot:", e)
    }

    // Calculate 24h ROI if we have historical data
    let roi24h = 0
    try {
      const result = await sql`
        SELECT balance, timestamp FROM smaug_roi_snapshots
        WHERE timestamp > NOW() - INTERVAL '24 hours'
        ORDER BY timestamp ASC
        LIMIT 1
      `
      
      if (result.rows && result.rows.length > 0) {
        const snapshot24hAgo = result.rows[0] as { balance: number; timestamp: string }
        const roi24h_calc = ((currentBalance - snapshot24hAgo.balance) / snapshot24hAgo.balance) * 100
        roi24h = roi24h_calc
      }
    } catch (e) {
      console.log("[v0] No 24h snapshot available yet:", e)
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
