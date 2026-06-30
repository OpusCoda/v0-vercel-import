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
    type Snap = { pls_earned: number; opus_price_usd: number; pls_price_usd: number }

    const [latestResult, latestPriceResult, snap24h, snap7d, snap30d] = await Promise.all([
      sql`SELECT pls_earned FROM opus_roi_snapshots ORDER BY snapshot_time DESC LIMIT 1`,
      sql`SELECT pls_price_usd FROM opus_roi_snapshots WHERE pls_price_usd > 0 ORDER BY snapshot_time DESC LIMIT 1`,
      sql`SELECT pls_earned, opus_price_usd FROM opus_roi_snapshots WHERE snapshot_time <= NOW() - INTERVAL '24 hours' ORDER BY snapshot_time DESC LIMIT 1`,
      sql`SELECT pls_earned, opus_price_usd FROM opus_roi_snapshots WHERE snapshot_time <= NOW() - INTERVAL '7 days' ORDER BY snapshot_time DESC LIMIT 1`,
      sql`SELECT pls_earned, opus_price_usd FROM opus_roi_snapshots WHERE snapshot_time <= NOW() - INTERVAL '30 days' ORDER BY snapshot_time DESC LIMIT 1`,
    ])

    if (latestResult.length === 0 || latestPriceResult.length === 0) {
      return { success: false, roi24h: null, roi7d: null, roi30d: null }
    }

    const currentPlsEarned = Number((latestResult[0] as { pls_earned: number }).pls_earned)
    const currentPlsPrice = Number((latestPriceResult[0] as { pls_price_usd: number }).pls_price_usd)

    // ROI = (PLS gained in period × current PLS price) / (100,000 Opus × Opus price at period start) × 100
    const calc = (snap: { pls_earned: number; opus_price_usd: number } | null) => {
      if (!snap) return null
      const plsGained = currentPlsEarned - Number(snap.pls_earned)
      const plsValueUsd = plsGained * currentPlsPrice
      const holdingValueUsd = 100000 * Number(snap.opus_price_usd)
      return holdingValueUsd > 0 ? (plsValueUsd / holdingValueUsd) * 100 : null
    }

    return {
      success: true,
      roi24h: snap24h.length > 0 ? calc(snap24h[0] as Snap) : null,
      roi7d:  snap7d.length  > 0 ? calc(snap7d[0]  as Snap) : null,
      roi30d: snap30d.length > 0 ? calc(snap30d[0] as Snap) : null,
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

/* ----------------------------- Referral system ----------------------------- */

// Names that may not be claimed (brand / impersonation / abuse protection).
const RESERVED_REFERRAL_NAMES = new Set([
  "opus",
  "opuseco",
  "smaug",
  "admin",
  "official",
  "support",
  "team",
  "mod",
  "moderator",
  "root",
  "system",
  "vault",
  "oath",
  "coda",
  "richardheart",
])

const NAME_PATTERN = /^[a-z0-9-]{3,20}$/

function normalizeName(name: string) {
  return name.trim().toLowerCase()
}

function isAddress(addr: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(addr.trim())
}

// Register a referral name for the connected wallet. One name per wallet.
export async function registerReferralName(rawName: string, walletAddress: string) {
  try {
    const name = normalizeName(rawName)

    if (!NAME_PATTERN.test(name)) {
      return { success: false, error: "Name must be 3-20 characters: lowercase letters, numbers, or hyphens." }
    }
    if (RESERVED_REFERRAL_NAMES.has(name)) {
      return { success: false, error: "That name is reserved and cannot be claimed." }
    }
    if (!isAddress(walletAddress)) {
      return { success: false, error: "A valid connected wallet is required." }
    }

    const wallet = walletAddress.trim()

    // Reject if this wallet already owns a name.
    const existingForWallet = await sql`
      SELECT name FROM referral_names WHERE LOWER(wallet_address) = LOWER(${wallet}) LIMIT 1
    `
    if (existingForWallet.length > 0) {
      return {
        success: false,
        error: `This wallet already owns the name "${(existingForWallet[0] as { name: string }).name}".`,
      }
    }

    // Reject if the name is taken.
    const existingName = await sql`
      SELECT id FROM referral_names WHERE LOWER(name) = ${name} LIMIT 1
    `
    if (existingName.length > 0) {
      return { success: false, error: "That name is already taken." }
    }

    await sql`
      INSERT INTO referral_names (name, wallet_address)
      VALUES (${name}, ${wallet})
    `
    return { success: true, name }
  } catch (error: any) {
    if (error?.code === "23505") {
      return { success: false, error: "That name is already taken." }
    }
    console.error("Error registering referral name:", error)
    return { success: false, error: "Failed to register name." }
  }
}

// Resolve a referral name to its owning wallet address.
export async function resolveReferralName(rawName: string) {
  try {
    const name = normalizeName(rawName)
    const result = await sql`
      SELECT name, wallet_address FROM referral_names WHERE LOWER(name) = ${name} LIMIT 1
    `
    if (result.length === 0) return { success: false, error: "Name not found." }
    const row = result[0] as { name: string; wallet_address: string }
    return { success: true, name: row.name, walletAddress: row.wallet_address }
  } catch (error) {
    console.error("Error resolving referral name:", error)
    return { success: false, error: "Failed to resolve name." }
  }
}

// Get the referral name owned by a wallet (if any).
export async function getReferralNameForWallet(walletAddress: string) {
  try {
    if (!isAddress(walletAddress)) return { success: false, name: null }
    const result = await sql`
      SELECT name FROM referral_names WHERE LOWER(wallet_address) = LOWER(${walletAddress}) LIMIT 1
    `
    if (result.length === 0) return { success: true, name: null }
    return { success: true, name: (result[0] as { name: string }).name }
  } catch (error) {
    console.error("Error fetching referral name for wallet:", error)
    return { success: false, name: null }
  }
}

// Permanently bind a user wallet to a referrer. Immutable: first binding wins.
export async function bindReferrer(userWallet: string, referrerNameOrAddress: string) {
  try {
    if (!isAddress(userWallet)) {
      return { success: false, error: "A valid connected wallet is required." }
    }

    // Resolve referrer to a wallet address (accepts a name or a raw address).
    let referrerWallet = ""
    let referrerName: string | null = null
    const input = referrerNameOrAddress.trim()

    if (isAddress(input)) {
      referrerWallet = input
      const nameRes = await sql`
        SELECT name FROM referral_names WHERE LOWER(wallet_address) = LOWER(${input}) LIMIT 1
      `
      if (nameRes.length > 0) referrerName = (nameRes[0] as { name: string }).name
    } else {
      const resolved = await resolveReferralName(input)
      if (!resolved.success || !resolved.walletAddress) {
        return { success: false, error: "Referrer not found." }
      }
      referrerWallet = resolved.walletAddress
      referrerName = resolved.name ?? null
    }

    // Reject self-referral.
    if (referrerWallet.toLowerCase() === userWallet.toLowerCase()) {
      return { success: false, error: "You cannot refer yourself." }
    }

    // Immutable binding: if already bound, keep the original.
    const existing = await sql`
      SELECT referrer_wallet, referrer_name FROM referral_bindings
      WHERE LOWER(user_wallet) = LOWER(${userWallet}) LIMIT 1
    `
    if (existing.length > 0) {
      const row = existing[0] as { referrer_wallet: string; referrer_name: string | null }
      return { success: true, alreadyBound: true, referrerWallet: row.referrer_wallet, referrerName: row.referrer_name }
    }

    await sql`
      INSERT INTO referral_bindings (user_wallet, referrer_wallet, referrer_name)
      VALUES (${userWallet}, ${referrerWallet}, ${referrerName})
      ON CONFLICT (user_wallet) DO NOTHING
    `
    return { success: true, alreadyBound: false, referrerWallet, referrerName }
  } catch (error) {
    console.error("Error binding referrer:", error)
    return { success: false, error: "Failed to bind referrer." }
  }
}

// Referral stats for a wallet: its name, who referred it, and how many it referred.
export async function getReferralStats(walletAddress: string) {
  try {
    if (!isAddress(walletAddress)) {
      return { success: false, name: null, referredBy: null, referralCount: 0 }
    }

    const [nameRes, referredByRes, countRes] = await Promise.all([
      sql`SELECT name FROM referral_names WHERE LOWER(wallet_address) = LOWER(${walletAddress}) LIMIT 1`,
      sql`SELECT referrer_wallet, referrer_name FROM referral_bindings WHERE LOWER(user_wallet) = LOWER(${walletAddress}) LIMIT 1`,
      sql`SELECT COUNT(*)::int AS count FROM referral_bindings WHERE LOWER(referrer_wallet) = LOWER(${walletAddress})`,
    ])

    return {
      success: true,
      name: nameRes.length > 0 ? (nameRes[0] as { name: string }).name : null,
      referredBy:
        referredByRes.length > 0
          ? (referredByRes[0] as { referrer_wallet: string; referrer_name: string | null })
          : null,
      referralCount: countRes.length > 0 ? (countRes[0] as { count: number }).count : 0,
    }
  } catch (error) {
    console.error("Error fetching referral stats:", error)
    return { success: false, name: null, referredBy: null, referralCount: 0 }
  }
}
