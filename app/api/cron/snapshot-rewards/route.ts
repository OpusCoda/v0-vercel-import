import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { ethers } from "ethers"

const DISTRIBUTOR_ABI = [
  "function totalMissorDistributed() view returns (uint256)",
  "function totalFinvestaDistributed() view returns (uint256)",
  "function totalWgppDistributed() view returns (uint256)",
  "function totalWethDistributed() view returns (uint256)",
  "function totalWbtcDistributed() view returns (uint256)",
  "function totalPlsxDistributed() view returns (uint256)",
]

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const sql = neon(process.env.DATABASE_URL!)
    const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL)

    const opusDistributors = [
      "0x7251d2965f165fCE18Ae5fC4c4979e01b46057d7",
      "0x90501f0C51c3aaDc76c9b27E501b68Db153Dcc81",
      "0xD14594f3c736E0D742Cfe2C3A177fb813c1C04B9",
    ]

    const codaDistributors = [
      "0xD9857f41E67812dbDFfdD3269B550836EC131D0C",
      "0x502E10403E20D6Ff42CBBDa7fdDC4e1315Da19AF",
      "0x2924Dc56bb4eeF50d0d32D8aCD6AA7c61aFa5dfe",
    ]

    let totalMissor = 0n, totalFinvesta = 0n, totalWgpp = 0n
    let totalWeth = 0n, totalPwbtc = 0n, totalPlsx = 0n

    for (const address of opusDistributors) {
      const contract = new ethers.Contract(address, DISTRIBUTOR_ABI, provider)
      try { totalMissor += BigInt(await contract.totalMissorDistributed()) } catch {}
      try { totalFinvesta += BigInt(await contract.totalFinvestaDistributed()) } catch {}
      try { totalWgpp += BigInt(await contract.totalWgppDistributed()) } catch {}
    }

    for (const address of codaDistributors) {
      const contract = new ethers.Contract(address, DISTRIBUTOR_ABI, provider)
      try { totalWeth += BigInt(await contract.totalWethDistributed()) } catch {}
      try { totalPwbtc += BigInt(await contract.totalWbtcDistributed()) } catch {}
      try { totalPlsx += BigInt(await contract.totalPlsxDistributed()) } catch {}
    }

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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Snapshot error:", error)
    return NextResponse.json({ error: "Failed to create snapshot" }, { status: 500 })
  }
}
