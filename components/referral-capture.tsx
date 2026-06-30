"use client"

import { useEffect } from "react"
import { resolveReferralName } from "@/app/actions"
import { setPendingReferrer, getPendingReferrer } from "@/lib/referral"

// Reads ?ref= from the URL on first load, resolves it to a referrer wallet,
// and stores it locally until the user's first protocol interaction.
// Renders nothing.
export function ReferralCapture() {
  useEffect(() => {
    const run = async () => {
      try {
        // Only capture the first referrer we ever see.
        if (getPendingReferrer()) return

        const params = new URLSearchParams(window.location.search)
        const ref = params.get("ref")
        if (!ref) return

        const trimmed = ref.trim()
        if (!trimmed) return

        // Resolve a raw address directly, otherwise look up the name.
        if (/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
          setPendingReferrer(trimmed, trimmed)
          return
        }

        const resolved = await resolveReferralName(trimmed)
        if (resolved.success && resolved.walletAddress) {
          setPendingReferrer(resolved.name ?? trimmed, resolved.walletAddress)
        }
      } catch (err) {
        console.error("[v0] Referral capture error:", err)
      }
    }
    run()
  }, [])

  return null
}
