import { NextRequest, NextResponse } from "next/server"
import { isAddress } from "viem"
import { VAULTS } from "@/lib/yield"
import { keys, redis } from "@/lib/yield-store"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address") ?? ""
  if (!isAddress(address)) return NextResponse.json({ error: "bad address" }, { status: 400 })

const hash = (await redis.hgetall<Record<string, string>>(keys.user(address.toLowerCase()))) ?? {}
  const totals: Record<string, { claimed: string; compounded: string }> = {}
  for (const key of Object.keys(VAULTS)) {
    totals[key] = {
      claimed: hash[`${key}:claimed`] ?? "0",
      compounded: hash[`${key}:compounded`] ?? "0",
    }
  }

  return NextResponse.json({ totals })
}
