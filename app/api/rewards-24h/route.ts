import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!)

    const latest = await sql`
      SELECT * FROM rewards_snapshots ORDER BY snapshot_time DESC LIMIT 1
    `

    const past = await sql`
      SELECT * FROM rewards_snapshots 
      WHERE snapshot_time <= NOW() - INTERVAL '23 hours'
      ORDER BY snapshot_time DESC LIMIT 1
    `

    if (latest.length === 0 || past.length === 0) {
      return NextResponse.json({ available: false })
    }

    const l = latest[0]
    const p = past[0]

    return NextResponse.json({
      available: true,
      changes: {
        missor: Number(l.opus_missor) - Number(p.opus_missor),
        finvesta: Number(l.opus_finvesta) - Number(p.opus_finvesta),
        wgpp: Number(l.opus_wgpp) - Number(p.opus_wgpp),
        weth: Number(l.coda_weth) - Number(p.coda_weth),
        pwbtc: Number(l.coda_pwbtc) - Number(p.coda_pwbtc),
        plsx: Number(l.coda_plsx) - Number(p.coda_plsx),
      },
    })
  } catch (error) {
    console.error("Error fetching 24h changes:", error)
    return NextResponse.json({ available: false })
  }
}
