import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const validatorId = searchParams.get("validatorId")

  if (!validatorId) {
    return NextResponse.json({ error: "validatorId is required" }, { status: 400 })
  }

  const beaconUrl = process.env.BEACON_RPC_URL || "https://beacon.g4mm4.io"

  console.log(`[v0] Fetching validator ${validatorId} from beacon chain API`)

  try {
    console.log(`[v0] Trying beacon API: ${beaconUrl}/eth/v1/beacon/states/head/validators/${validatorId}`)

    const response = await fetch(`${beaconUrl}/eth/v1/beacon/states/head/validators/${validatorId}`, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(10000),
    })

    console.log(`[v0] Response status: ${response.status} from ${beaconUrl}`)

    if (!response.ok) {
      const text = await response.text()
      console.log(`[v0] Error response from ${beaconUrl}: ${text.substring(0, 200)}`)
      throw new Error(`Beacon API returned ${response.status}: ${response.statusText}`)
    }

    const contentType = response.headers.get("content-type")
    console.log(`[v0] Response content-type: ${contentType}`)

    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text()
      console.log(`[v0] Non-JSON response: ${text.substring(0, 200)}`)
      throw new Error("Beacon API returned non-JSON response")
    }

    const data = await response.json()
    console.log(`[v0] Received data structure:`, Object.keys(data))

    if (!data.data) {
      console.log(`[v0] Invalid data structure:`, data)
      throw new Error("Invalid validator data structure")
    }

    const validatorData = {
      index: data.data?.index || "N/A",
      balance: data.data?.balance ? Number(data.data.balance) / 1e9 : 0,
      status: data.data?.status || "Unknown",
      effectiveBalance: data.data?.effective_balance ? Number(data.data.effective_balance) / 1e9 : 0,
    }

    console.log(`[v0] Successfully parsed validator data:`, validatorData)

    return NextResponse.json(validatorData)
  } catch (error) {
    console.error("[v0] Validator fetch error:", error)
    return NextResponse.json({ error: `Failed to fetch validator data: ${error.message}` }, { status: 500 })
  }
}
