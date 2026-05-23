import { getOpusRoi } from "@/app/actions"

export async function GET() {
  try {
    const result = await getOpusRoi()

    return Response.json({
      roi24h: result.roi24h,
      roi7d: result.roi7d,
      roi30d: result.roi30d,
      wallet: "0xB1B7847969C2c62A6fCbC1fED52176aBAc0b9300",
      contract: "0x9B5a65E37f338ADD1263530DDac8CEc56204bB3a",
      note: "ROI is % growth in PLS earned by reference wallet (100,000 OPUS held). Snapshots taken every 10 minutes.",
      timestamp: new Date(),
    })
  } catch (error) {
    console.error("[v0] Error fetching Opus ROI stats:", error)
    return Response.json({ error: "Failed to fetch Opus ROI stats" }, { status: 500 })
  }
}
