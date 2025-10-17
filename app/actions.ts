"use server"

import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

// Generate a unique 6-character Portfolio ID
function generateUniqueId(): string {
  const chars = "ABCDEFGHJKLMNOPQRSTUVWXYZ23456789"
  let code = ""
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function savePortfolio(wallets: { address: string; label?: string }[]) {
  try {
    // Generate unique ID (retry if collision)
    let portfolioId = generateUniqueId()
    let attempts = 0

    while (attempts < 10) {
      try {
        await sql`
          INSERT INTO portfolios (portfolio_id, wallet_data)
          VALUES (${portfolioId}, ${JSON.stringify({ wallets })})
        `
        return { success: true, portfolioId }
      } catch (error: any) {
        // If unique constraint violation, try again with new ID
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

    const walletData = result[0].wallet_data as { wallets: { address: string; label?: string }[] }
    return { success: true, wallets: walletData.wallets }
  } catch (error) {
    console.error("Error loading portfolio:", error)
    return { success: false, error: "Failed to load portfolio" }
  }
}
