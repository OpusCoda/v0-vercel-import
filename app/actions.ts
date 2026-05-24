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

export async function storeOpusRoiSnapshot(plsEarned: number, opusPriceUsd: number = 0, plsPriceUsd: number = 0) {
  try {
    await sql`
      INSERT INTO opus_roi_snapshots (pls_earned, opus_price_usd, pls_price_usd, snapshot_time)
      VALUES (${plsEarned}, ${opusPriceUsd}, ${plsPriceUsd}, NOW())
    `
    return { success: true }
  } catch (error) {
    console.error("Error storing Opus ROI snapshot:", error)
    return { success: false, error: "Failed to store snapshot" }
  }
}

export async function getOpusRoi() {
  try {
    // Get latest snapshot for current pls_earned and current prices
    const [latestResult, snap24h, snap7d, snap30d] = await Promise.all([
      sql`SELECT pls_earned, opus_price_usd, pls_price_usd FROM opus_roi_snapshots ORDER BY snapshot_time DESC LIMIT 1`,
      // Fetch pls_earned AND prices from the period-start snapshot so denominator uses that period's Opus price
      sql`SELECT pls_earned, opus_price_usd, pls_price_usd FROM opus_roi_snapshots WHERE snapshot_time <= NOW() - INTERVAL '24 hours' ORDER BY snapshot_time DESC LIMIT 1`,
      sql`SELECT pls_earned, opus_price_usd, pls_price_usd FROM opus_roi_snapshots WHERE snapshot_time <= NOW() - INTERVAL '7 days' ORDER BY snapshot_time DESC LIMIT 1`,
      sql`SELECT pls_earned, opus_price_usd, pls_price_usd FROM opus_roi_snapshots WHERE snapshot_time <= NOW() - INTERVAL '30 days' ORDER BY snapshot_time DESC LIMIT 1`,
    ])

    if (latestResult.length === 0) {
      return { success: false, roi24h: null, roi7d: null, roi30d: null }
    }

    const latest = latestResult[0] as { pls_earned: number; opus_price_usd: number; pls_price_usd: number }
    const currentPlsEarned = Number(latest.pls_earned)
    // Use most recent valid pls_price for numerator — latest snapshot may have pls_price=0 if cron failed to fetch
    const latestPriceRow = latestPrices[0] as { pls_price_usd: number } | undefined
    const currentPlsPrice = latestPriceRow ? Number(latestPriceRow.pls_price_usd) : 0

    // ROI = (PLS gained in period × current PLS price) / (100,000 Opus × Opus price at period start) × 100
    const calc = (snap: { pls_earned: number; opus_price_usd: number; pls_price_usd: number } | null) => {
      if (!snap) return null
      const plsGained = currentPlsEarned - Number(snap.pls_earned)
      const plsValueUsd = plsGained * currentPlsPrice
      const holdingValueUsd = 100000 * Number(snap.opus_price_usd)
      return holdingValueUsd > 0 ? (plsValueUsd / holdingValueUsd) * 100 : 0
    }

    return {
      success: true,
      roi24h: snap24h.length > 0 ? calc(snap24h[0] as { pls_earned: number; opus_price_usd: number; pls_price_usd: number }) : null,
      roi7d:  snap7d.length  > 0 ? calc(snap7d[0]  as { pls_earned: number; opus_price_usd: number; pls_price_usd: number }) : null,
      roi30d: snap30d.length > 0 ? calc(snap30d[0] as { pls_earned: number; opus_price_usd: number; pls_price_usd: number }) : null,
    }
  } catch (error) {
    console.error("Error fetching Opus ROI:", error)
    return { success: false, roi24h: null, roi7d: null, roi30d: null }
  }
}

export async function storeCodaRoiSnapshot(wethEarned: number, pwbtcEarned: number, plsxEarned: number, usdValue: number, codaPriceUsd: number = 0) {
  try {
    await sql`
      INSERT INTO coda_roi_snapshots (weth_earned, pwbtc_earned, plsx_earned, usd_value, coda_price_usd, snapshot_time)
      VALUES (${wethEarned}, ${pwbtcEarned}, ${plsxEarned}, ${usdValue}, ${codaPriceUsd}, NOW())
    `
    return { success: true }
  } catch (error) {
    console.error("Error storing Coda ROI snapshot:", error)
    return { success: false, error: "Failed to store snapshot" }
  }
}

export async function getCodaRoi() {
  try {
    const [latestResult, latestPrices, snap24h, snap7d, snap30d] = await Promise.all([
      sql`SELECT usd_value FROM coda_roi_snapshots ORDER BY snapshot_time DESC LIMIT 1`,
      sql`SELECT coda_price_usd FROM coda_roi_snapshots WHERE coda_price_usd > 0 ORDER BY snapshot_time DESC LIMIT 1`,
      sql`SELECT usd_value, coda_price_usd FROM coda_roi_snapshots WHERE snapshot_time <= NOW() - INTERVAL '24 hours' ORDER BY snapshot_time DESC LIMIT 1`,
      sql`SELECT usd_value, coda_price_usd FROM coda_roi_snapshots WHERE snapshot_time <= NOW() - INTERVAL '7 days' ORDER BY snapshot_time DESC LIMIT 1`,
      sql`SELECT usd_value, coda_price_usd FROM coda_roi_snapshots WHERE snapshot_time <= NOW() - INTERVAL '30 days' ORDER BY snapshot_time DESC LIMIT 1`,
    ])

    if (latestResult.length === 0) {
      return { success: false, roi24h: null, roi7d: null, roi30d: null }
    }

    const currentUsdValue = Number((latestResult[0] as { usd_value: number }).usd_value)

    // ROI = (rewards USD gained in period) / (100,000,000 CODA × CODA price at period start) × 100
    const calc = (snap: { usd_value: number; coda_price_usd: number } | null) => {
      if (!snap) return null
      const rewardsGained = currentUsdValue - Number(snap.usd_value)
      const holdingValueUsd = 100000000 * Number(snap.coda_price_usd)
      return holdingValueUsd > 0 ? (rewardsGained / holdingValueUsd) * 100 : null
    }

    return {
      success: true,
      roi24h: snap24h.length > 0 ? calc(snap24h[0] as { usd_value: number; coda_price_usd: number }) : null,
      roi7d:  snap7d.length  > 0 ? calc(snap7d[0]  as { usd_value: number; coda_price_usd: number }) : null,
      roi30d: snap30d.length > 0 ? calc(snap30d[0] as { usd_value: number; coda_price_usd: number }) : null,
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
