import { ethers } from "ethers"
import { getSmaugRoi } from "@/app/actions"

export const dynamic = "force-dynamic"

const SMAUG_ADDRESS = "0xf4754Aa585caBf38537A68660469A17E203D8632"
const SMAUG_ABI = ["event LPAdded(uint256 plsAmount, uint256 tokenAmount)"]
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.pulsechain.com"

export async function GET() {
  const [roiResult, burnedPls] = await Promise.all([
    getSmaugRoi(),
    (async () => {
      try {
        const provider = new ethers.JsonRpcProvider(RPC_URL)
        const contract = new ethers.Contract(SMAUG_ADDRESS, SMAUG_ABI, provider)
        const events = await contract.queryFilter(contract.filters.LPAdded(), 0, "latest")
        let total = 0n
        for (const event of events) {
          const log = event as ethers.EventLog
          total += BigInt(log.args[0])
        }
        return Number(ethers.formatUnits(total, 18))
      } catch {
        return null
      }
    })(),
  ])

  return Response.json({
    smaug: {
      roi24h: roiResult.roi24h ?? null,
      roi7d: roiResult.roi7d ?? null,
      roi30d: roiResult.roi30d ?? null,
    },
    burnedPlsAdded: burnedPls,
    description: "ROI % = PLS rewards added to vault in period (USD) / 100,000 Smaug holding value at period start (USD) × 100. burnedPlsAdded is total PLS added to burned LP since contract deployment.",
    updatedAt: new Date().toISOString(),
  })
}
