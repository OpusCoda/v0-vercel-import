import { getCodaRoi } from "@/app/actions"

export async function GET() {
  try {
    const result = await getCodaRoi()

    return Response.json({
      roi24h: result.roi24h,
      roi7d: result.roi7d,
      roi30d: result.roi30d,
      wallet: "0xB1B7847969C2c62A6fCbC1fED52176aBAc0b9300",
      contract: "0x2924Dc56bb4eeF50d0d32D8aCD6AA7c61aFa5dfe",
      note: "ROI is % growth in combined USD value of WETH + pWBTC + PLSX earned by reference wallet (100,000,000 CODA held). Snapshots taken every 10 minutes.",
      timestamp: new Date(),
    })
  } catch (error) {
    console.error("[v0] Error fetching Coda ROI stats:", error)
    return Response.json({ error: "Failed to fetch Coda ROI stats" }, { status: 500 })
  }
}
