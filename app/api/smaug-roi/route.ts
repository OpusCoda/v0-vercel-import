import { ethers } from "ethers"

const SMAUG_ADDRESS = "0xf4754Aa585caBf38537A68660469A17E203D8632"
const ROI_WALLET = "0xB1B7847969C2c62A6fCbC1fED52176aBAc0b9300"
const INITIAL_BALANCE = 1_000_000 // 1 million Smaug

const BALANCE_ABI = ["function balanceOf(address) public view returns (uint256)"]

export async function GET() {
  try {
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.pulsechain.com"
    const provider = new ethers.JsonRpcProvider(rpcUrl)

    // Fetch current balance
    const contract = new ethers.Contract(SMAUG_ADDRESS, BALANCE_ABI, provider)
    const balance = await contract.balanceOf(ROI_WALLET)
    const currentBalance = Number(ethers.formatEther(balance))

    // For now, just return the current balance without database operations
    // Database snapshots will be stored through Server Actions instead
    const totalROI = ((currentBalance - INITIAL_BALANCE) / INITIAL_BALANCE) * 100

    return Response.json({
      currentBalance,
      initialBalance: INITIAL_BALANCE.toString(),
      roi24h: 0, // Will be calculated from snapshots stored via Server Action
      totalROI,
      timestamp: new Date(),
    })
  } catch (error) {
    console.error("[v0] Error fetching SMAUG ROI:", error)
    return Response.json({ error: "Failed to fetch ROI data" }, { status: 500 })
  }
}
