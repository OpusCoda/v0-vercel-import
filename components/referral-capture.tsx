"use client"
import { useEffect } from "react"
import { resolveReferralName } from "@/app/actions"
import { setPendingReferrer, getPendingReferrer } from "@/lib/referral"

export function ReferralCapture() {
  useEffect(() => {
    const removeReferralFromUrl = () => {
      const url = new URL(window.location.href)
      url.searchParams.delete("ref")
      const cleanUrl =
        url.pathname +
        (url.searchParams.size > 0 ? `?${url.searchParams.toString()}` : "") +
        url.hash
      window.history.replaceState(window.history.state, "", cleanUrl)
    }

    const run = async () => {
      try {
        const params = new URLSearchParams(window.location.search)
        const ref = params.get("ref")

        // Preserve the first valid referrer captured on this device/browser,
        // but still clean the URL if a ?ref= is visible on a later visit.
        const existingReferrer = getPendingReferrer()
        if (existingReferrer) {
          if (params.has("ref")) removeReferralFromUrl()
          return
        }

        if (!ref) return
        const trimmed = ref.trim().toLowerCase()
        if (!trimmed) return

        // Raw wallet address — use directly, no name resolution needed.
        if (/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
          setPendingReferrer(trimmed, trimmed)
          removeReferralFromUrl()
          return
        }

        // User-selected referral name — resolve to a wallet address.
        const resolved = await resolveReferralName(trimmed)
        if (resolved.success && resolved.walletAddress) {
          setPendingReferrer(resolved.name ?? trimmed, resolved.walletAddress)
          removeReferralFromUrl()
        }
      } catch (err) {
        console.error("[v0] Referral capture error:", err)
      }
    }

    void run()
  }, [])

  return null
}