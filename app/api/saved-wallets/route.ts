import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"

const sql = neon(process.env.DATABASE_URL!)

// GET - Load saved wallet list
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const name = searchParams.get("name")

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const result = await sql`
      SELECT wallet_addresses 
      FROM saved_wallet_lists 
      WHERE list_name = ${name.toLowerCase().trim()}
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Wallet list not found" }, { status: 404 })
    }

    return NextResponse.json({
      addresses: result[0].wallet_addresses,
    })
  } catch (error) {
    console.error("Error loading wallet list:", error)
    return NextResponse.json({ error: "Failed to load wallet list" }, { status: 500 })
  }
}

// POST - Save wallet list
export async function POST(request: Request) {
  try {
    const { name, addresses } = await request.json()

    if (!name || !addresses || !Array.isArray(addresses)) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
    }

    // Insert or update wallet list
    await sql`
      INSERT INTO saved_wallet_lists (list_name, wallet_addresses, last_updated)
      VALUES (${name.toLowerCase().trim()}, ${JSON.stringify(addresses)}, NOW())
      ON CONFLICT (list_name) 
      DO UPDATE SET 
        wallet_addresses = ${JSON.stringify(addresses)},
        last_updated = NOW()
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving wallet list:", error)
    return NextResponse.json({ error: "Failed to save wallet list" }, { status: 500 })
  }
}
