import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { ethers } from "ethers"

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL)

    // Helper to safely call contract using raw provider.call
    const safeCall = async (to: string, data: string): Promise<bigint> => {
      try {
        const result = await provider.call({ to, data })
        return result && result !== "0x" ? BigInt(result) : 0n
      } catch {
        return 0n
      }
    }

    // Function selectors
    const SEL = {
      missor: ethers.id("totalMissorDistributed()").slice(0, 10),
      finvesta: ethers.id("totalFinvestaDistributed()").slice(0, 10),
      wgpp: ethers.id("totalWgppDistributed()").slice(0, 10),
      weth: ethers.id("totalWethDistributed()").slice(0, 10),
      wbtc: ethers.id("totalWbtcDistributed()").slice(0, 10),
      plsx: ethers.id("totalPlsxDistributed()").slice(0, 10),
    }

    const opus = [
      "0x7251d2965f165fCE18Ae5fC4c4979e01b46057d7",
      "0x90501f0C51c3aaDc76c9b27E501b68Db153Dcc81",
      "0xD14594f3c736E0D742Cfe2C3A177fb813c1C04B9",
    ]

    const coda = [
      "0xD9857f41E67812dbDFfdD3269B550836EC131D0C",
      "0x502E10403E20D6Ff42CBBDa7fdDC4e1315Da19AF",
      "0x2924Dc56bb4eeF50d0d32D8aCD6AA7c61aFa5dfe",
    ]

    // Fetch all values in parallel
    const results = await Promise.all([
      safeCall(opus[0], SEL.missor), safeCall(opus[1], SEL.missor), safeCall(opus[2], SEL.missor),
      safeCall(opus[0], SEL.finvesta), safeCall(opus[1], SEL.finvesta), safeCall(opus[2], SEL.finvesta),
      safeCall(opus[0], SEL.wgpp), safeCall(opus[1], SEL.wgpp), safeCall(opus[2], SEL.wgpp),
      safeCall(coda[0], SEL.weth), safeCall(coda[1], SEL.weth), safeCall(coda[2], SEL.weth),
      safeCall(coda[0], SEL.wbtc), safeCall(coda[1], SEL.wbtc), safeCall(coda[2], SEL.wbtc),
      safeCall(coda[0], SEL.plsx), safeCall(coda[1], SEL.plsx), safeCall(coda[2], SEL.plsx),
    ])

    const totalMissor = results[0] + results[1] + results[2]
    const totalFinvesta = results[3] + results[4] + results[5]
    const totalWgpp = results[6] + results[7] + results[8]
    const totalWeth = results[9] + results[10] + results[11]
    const totalPwbtc = results[12] + results[13] + results[14]
    const totalPlsx = results[15] + results[16] + results[17]

    await sql`
      INSERT INTO rewards_snapshots (opus_missor, opus_finvesta, opus_wgpp, coda_weth, coda_pwbtc, coda_plsx)
      VALUES (
        ${ethers.formatUnits(totalMissor, 18)},
        ${ethers.formatUnits(totalFinvesta, 8)},
        ${ethers.formatUnits(totalWgpp, 18)},
        ${ethers.formatUnits(totalWeth, 18)},
        ${ethers.formatUnits(totalPwbtc, 8)},
        ${ethers.formatUnits(totalPlsx, 18)}
      )
    `

    await sql`DELETE FROM rewards_snapshots WHERE snapshot_time < NOW() - INTERVAL '48 hours'`

    return NextResponse.json({ success: true, totals: {
      missor: ethers.formatUnits(totalMissor, 18),
      finvesta: ethers.formatUnits(totalFinvesta, 8),
      wgpp: ethers.formatUnits(totalWgpp, 18),
      weth: ethers.formatUnits(totalWeth, 18),
      pwbtc: ethers.formatUnits(totalPwbtc, 8),
      plsx: ethers.formatUnits(totalPlsx, 18),
    }})
  } catch (error) {
    console.error("Snapshot error:", error)
    return NextResponse.json({ error: "Failed to create snapshot", details: String(error) }, { status: 500 })
  }
}
