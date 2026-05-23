"use server"

import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.POSTGRES_URL!)

function generateUniqueId(): string {
  const chars = "ABCDEFGHJKLMNOPQRSTUVWXYZ23456789"
  let code = ""
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function savePortfolio(wallets: { address: string; label?: string }[], tokens: string[] = []) {
  try {
    let portfolioId = generateUniqueId()
    let attempts = 0

    while (attempts < 10) {
      try {
        await sql`
          INSERT INTO portfolios (portfolio_id, wallet_data)
          VALUES (${portfolioId}, ${JSON.stringify({ wallets, tokens })})
        `
        return { success: true, portfolioId }
      } catch (error: any) {
        if (error.code === "23505") {
          portfolioId = generateUniqueId()
          attempts++
        } else {
          throw error
        }
      }
    }

    return { success: false, error: "Failed to generate unique ID" }
  } catch (error) {
    console.error("Error saving portfolio:", error)
    return { success: false, error: "Failed to save portfolio" }
  }
}

export async function loadPortfolio(portfolioId: string) {
  try {
    const result = await sql`
      SELECT wallet_data FROM portfolios
      WHERE portfolio_id = ${portfolioId.toUpperCase()}
      LIMIT 1
    `

    if (result.length === 0) {
      return { success: false, error: "Portfolio ID not found" }
    }

    const walletData = result[0].wallet_data as {
      wallets: { address: string; label?: string }[]
      tokens?: string[]
    }
    return {
      success: true,
      wallets: walletData.wallets,
      tokens: walletData.tokens || [],
    }
  } catch (error) {
    console.error("Error loading portfolio:", error)
    return { success: false, error: "Failed to load portfolio" }
  }
}

export async function storeOpusRoiSnapshot(plsEarned: number) {
  try {
    await sql`
      INSERT INTO opus_roi_snapshots (pls_earned, snapshot_time)
      VALUES (${plsEarned}, NOW())
    `
    return { success: true }
  } catch (error) {
    console.error("Error storing Opus ROI snapshot:", error)
    return { success: false, error: "Failed to store snapshot" }
  }
}

export async function getOpusRoi() {
  try {
    const currentResult = await sql`
      SELECT pls_earned FROM opus_roi_snapshots
      ORDER BY snapshot_time DESC
      LIMIT 1
    `
    if (currentResult.length === 0) {
      return { success: false, roi24h: null, roi7d: null, roi30d: null }
    }
    const currentEarned = (currentResult[0] as { pls_earned: number }).pls_earned

    const [snap24h, snap7d, snap30d] = await Promise.all([
      sql`SELECT pls_earned FROM opus_roi_snapshots WHERE snapshot_time <= NOW() - INTERVAL '24 hours' ORDER BY snapshot_time DESC LIMIT 1`,
      sql`SELECT pls_earned FROM opus_roi_snapshots WHERE snapshot_time <= NOW() - INTERVAL '7 days' ORDER BY snapshot_time DESC LIMIT 1`,
      sql`SELECT pls_earned FROM opus_roi_snapshots WHERE snapshot_time <= NOW() - INTERVAL '30 days' ORDER BY snapshot_time DESC LIMIT 1`,
    ])

    const calc = (old: number) => ((currentEarned - old) / old) * 100

    return {
      success: true,
      roi24h: snap24h.length > 0 ? calc((snap24h[0] as { pls_earned: number }).pls_earned) : null,
      roi7d:  snap7d.length  > 0 ? calc((snap7d[0]  as { pls_earned: number }).pls_earned) : null,
      roi30d: snap30d.length > 0 ? calc((snap30d[0] as { pls_earned: number }).pls_earned) : null,
    }
  } catch (error) {
    console.error("Error fetching Opus ROI:", error)
    return { success: false, roi24h: null, roi7d: null, roi30d: null }
  }
}

export async function storeCodaRoiSnapshot(wethEarned: number, pwbtcEarned: number, plsxEarned: number, usdValue: number) {
  try {
    await sql`
      INSERT INTO coda_roi_snapshots (weth_earned, pwbtc_earned, plsx_earned, usd_value, snapshot_time)
      VALUES (${wethEarned}, ${pwbtcEarned}, ${plsxEarned}, ${usdValue}, NOW())
    `
    return { success: true }
  } catch (error) {
    console.error("Error storing Coda ROI snapshot:", error)
    return { success: false, error: "Failed to store snapshot" }
  }
}

export async function getCodaRoi() {
  try {
    const currentResult = await sql`
      SELECT usd_value FROM coda_roi_snapshots
      ORDER BY snapshot_time DESC
      LIMIT 1
    `
    if (currentResult.length === 0) {
      return { success: false, roi24h: null, roi7d: null, roi30d: null }
    }
    const current = (currentResult[0] as { usd_value: number }).usd_value

    const [snap24h, snap7d, snap30d] = await Promise.all([
      sql`SELECT usd_value FROM coda_roi_snapshots WHERE snapshot_time <= NOW() - INTERVAL '24 hours' ORDER BY snapshot_time DESC LIMIT 1`,
      sql`SELECT usd_value FROM coda_roi_snapshots WHERE snapshot_time <= NOW() - INTERVAL '7 days' ORDER BY snapshot_time DESC LIMIT 1`,
      sql`SELECT usd_value FROM coda_roi_snapshots WHERE snapshot_time <= NOW() - INTERVAL '30 days' ORDER BY snapshot_time DESC LIMIT 1`,
    ])

    const calc = (old: number) => ((current - old) / old) * 100

    return {
      success: true,
      roi24h: snap24h.length > 0 ? calc((snap24h[0] as { usd_value: number }).usd_value) : null,
      roi7d:  snap7d.length  > 0 ? calc((snap7d[0]  as { usd_value: number }).usd_value) : null,
      roi30d: snap30d.length > 0 ? calc((snap30d[0] as { usd_value: number }).usd_value) : null,
    }
  } catch (error) {
    console.error("Error fetching Coda ROI:", error)
    return { success: false, roi24h: null, roi7d: null, roi30d: null }
  }
}

export async function storeSmaugRoiSnapshot(balance: number) {
  try {
    await sql`
      INSERT INTO smaug_roi_snapshots (smaug_balance, snapshot_time)
      VALUES (${balance}, NOW())
    `
    return { success: true }
  } catch (error) {
    console.error("Error storing SMAUG ROI snapshot:", error)
    return { success: false, error: "Failed to store snapshot" }
  }
}

export async function getSmaugRoi() {
  try {
    const currentResult = await sql`
      SELECT smaug_balance FROM smaug_roi_snapshots
      ORDER BY snapshot_time DESC
      LIMIT 1
    `
    if (currentResult.length === 0) {
      return { success: false, roi24h: null, roi7d: null, roi30d: null }
    }
    const currentBalance = (currentResult[0] as { smaug_balance: number }).smaug_balance

    const [snap24h, snap7d, snap30d] = await Promise.all([
      sql`SELECT smaug_balance FROM smaug_roi_snapshots WHERE snapshot_time <= NOW() - INTERVAL '24 hours' ORDER BY snapshot_time DESC LIMIT 1`,
      sql`SELECT smaug_balance FROM smaug_roi_snapshots WHERE snapshot_time <= NOW() - INTERVAL '7 days' ORDER BY snapshot_time DESC LIMIT 1`,
      sql`SELECT smaug_balance FROM smaug_roi_snapshots WHERE snapshot_time <= NOW() - INTERVAL '30 days' ORDER BY snapshot_time DESC LIMIT 1`,
    ])

    const calc = (old: number) => ((currentBalance - old) / old) * 100

    return {
      success: true,
      roi24h: snap24h.length > 0 ? calc((snap24h[0] as { smaug_balance: number }).smaug_balance) : null,
      roi7d:  snap7d.length  > 0 ? calc((snap7d[0]  as { smaug_balance: number }).smaug_balance) : null,
      roi30d: snap30d.length > 0 ? calc((snap30d[0] as { smaug_balance: number }).smaug_balance) : null,
    }
  } catch (error) {
    console.error("Error fetching SMAUG ROI:", error)
    return { success: false, roi24h: null, roi7d: null, roi30d: null }
  }
}
