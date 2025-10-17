import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const validatorId = searchParams.get("validatorId")

  if (!validatorId) {
    return NextResponse.json({ error: "validatorId is required" }, { status: 400 })
  }

  const rpcUrls = [
    process.env.BEACON_RPC_URL,
    "https://checkpoint.pulsechain.com",
    "https://pulsechain-beacon.publicnode.com",
  ].filter(Boolean)

  const stateIds = ["finalized", "head", "justified"]

  let lastError = ""
  let emptyResponseCount = 0

  for (const url of rpcUrls) {
    for (const stateId of stateIds) {
      try {
        const fullUrl = `${url}/eth/v1/beacon/states/${stateId}/validators/${validatorId}`
        console.log("[v0] Attempting fetch from:", fullUrl)

        const response = await fetch(fullUrl, {
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(5000),
        })

        console.log(`[v0] Response from ${url} (${stateId}): ${response.status}`)

        const responseText = await response.text()
        console.log(`[v0] Response body length: ${responseText.length}`)

        if (response.status === 404) {
          console.log(`[v0] Validator ${validatorId} not found at ${url} (${stateId})`)
          lastError = "not_found"
          continue
        }

        if (response.ok) {
          if (!responseText || responseText.trim().length === 0) {
            console.log(`[v0] Empty response body from ${url} (${stateId}) - endpoint may not support beacon API`)
            emptyResponseCount++
            lastError = "empty_response"
            continue
          }

          try {
            const data = JSON.parse(responseText)
            console.log("[v0] Successfully parsed JSON from:", url, stateId)

            if (!data.data) {
              console.log("[v0] No validator data in response")
              lastError = "invalid_response"
              continue
            }

            const validatorData = {
              index: data.data.index,
              balance: Number(data.data.balance) / 1e9,
              status: data.data.status,
              effectiveBalance: Number(data.data.effective_balance) / 1e9,
            }

            return NextResponse.json(validatorData)
          } catch (parseError) {
            console.log(`[v0] JSON parse error from ${url} (${stateId}):`, parseError.message)
            lastError = `json_parse_error: ${parseError.message}`
            continue
          }
        }

        console.log(`[v0] Failed ${url} (${stateId}): ${response.status} - ${response.statusText}`)
        lastError = `${response.status}: ${response.statusText}`
      } catch (error) {
        console.log(`[v0] Error fetching from ${url} (${stateId}):`, error.message)
        lastError = error.message
      }
    }
  }

  if (lastError === "not_found") {
    return NextResponse.json(
      {
        error: `Validator #${validatorId} not found`,
        hint: "This validator may not exist on PulseChain yet. Try a different validator ID.",
      },
      { status: 404 },
    )
  }

  if (emptyResponseCount > 0 || lastError === "empty_response") {
    return NextResponse.json(
      {
        error: "PulseChain Beacon API is not publicly available",
        hint: "The PulseChain Beacon API is currently listed as 'Available Soon' on PublicNode. Validator tracking will work once the API is publicly launched.",
      },
      { status: 503 },
    )
  }

  return NextResponse.json(
    {
      error: "Unable to fetch validator data",
      hint: "The PulseChain Beacon API may not be publicly available yet. Check back later or configure a custom BEACON_RPC_URL.",
      lastError,
    },
    { status: 503 },
  )
}
