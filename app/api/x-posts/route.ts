import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"

const sql = neon(process.env.DATABASE_URL!)

interface XPost {
  id: string
  handle: string
  name: string
  text: string
  url: string
  created_at: string
}

interface XPostResponse {
  posts: Array<{
    id: string
    handle: string
    name: string
    text: string
    url: string
    timestamp: string
  }>
  errors?: string[]
}

export const dynamic = "force-dynamic"

// Trigger the cron job on-demand if cache is stale
async function triggerCronFetch() {
  try {
    const CRON_SECRET = process.env.CRON_SECRET
    if (!CRON_SECRET) {
      console.warn("[x-posts] CRON_SECRET not set, skipping on-demand fetch")
      return
    }

    // Call the cron endpoint
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/cron/fetch-x-posts`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${CRON_SECRET}`,
        },
        cache: "no-store",
      }
    )

    if (!response.ok) {
      console.warn(`[x-posts] Cron fetch returned ${response.status}`)
    }
  } catch (err) {
    console.error("[x-posts] Failed to trigger cron:", err instanceof Error ? err.message : String(err))
  }
}

export async function GET(): Promise<NextResponse<XPostResponse>> {
  try {
    // Trigger cron fetch in background (don't await)
    triggerCronFetch().catch(() => {})

    // Fetch posts from database
    const posts = await sql<XPost>`
      SELECT id, handle, name, text, url, created_at
      FROM x_posts
      ORDER BY created_at DESC
      LIMIT 20
    `

    const response: XPostResponse = {
      posts: posts.map((post) => ({
        id: post.id,
        handle: post.handle,
        name: post.name,
        text: post.text,
        url: post.url,
        timestamp: new Date(post.created_at).toISOString(),
      })),
    }

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    })
  } catch (error) {
    console.error("[x-posts] Database error:", error)

    // Return empty posts on error rather than breaking
    return NextResponse.json(
      {
        posts: [],
        errors: ["Failed to fetch posts from database"],
      },
      { status: 500 }
    )
  }
}
