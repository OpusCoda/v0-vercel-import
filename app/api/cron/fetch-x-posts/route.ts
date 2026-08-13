import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"

const sql = neon(process.env.DATABASE_URL!)

// Handles to track. vxtwitter returns the single latest tweet per handle,
// so we accumulate them in the database over time to build a feed history.
const HANDLES = ["OpusEco", "RichardHeartWin", "CryptoCoffee369"]

interface FetchedPost {
  id: string
  handle: string
  name: string
  text: string
  url: string
  timestamp: string
}

// vxtwitter returns ONE tweet per handle as a flat object, not an array.
// Shape (partial): { tweetID, text, user_name, user_screen_name, date, date_epoch }
async function fetchLatestTweet(handle: string): Promise<FetchedPost | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const res = await fetch(`https://api.vxtwitter.com/${handle}`, {
      cache: "no-store",
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout))

    if (!res.ok) {
      console.warn(`[cron/fetch-x-posts] ${handle}: HTTP ${res.status}`)
      return null
    }

    const data = await res.json()

    // vxtwitter uses tweetID; fall back to id if present.
    const tweetId: string | undefined = data.tweetID ?? data.id
    const text: string | undefined = data.text
    if (!tweetId || !text) {
      console.warn(`[cron/fetch-x-posts] ${handle}: unexpected shape`, Object.keys(data))
      return null
    }

    const screenName: string = data.user_screen_name ?? handle
    const name: string = data.user_name ?? handle

    // date_epoch is seconds; date is a string. Prefer epoch for accuracy.
    const timestamp = data.date_epoch
      ? new Date(Number(data.date_epoch) * 1000).toISOString()
      : data.date
      ? new Date(data.date).toISOString()
      : new Date().toISOString()

    return {
      id: String(tweetId),
      handle: screenName,
      name,
      text,
      url: `https://x.com/${screenName}/status/${tweetId}`,
      timestamp,
    }
  } catch (err) {
    console.error(
      `[cron/fetch-x-posts] ${handle}: fetch failed:`,
      err instanceof Error ? err.message : String(err)
    )
    return null
  }
}

async function checkAndFetchPosts(): Promise<{ success: boolean; message: string; count: number }> {
  try {
    // Ensure the table exists with the columns this cron writes.
    await sql`
      CREATE TABLE IF NOT EXISTS x_posts (
        id VARCHAR(255) PRIMARY KEY,
        handle VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        text TEXT,
        url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Throttle: skip if we fetched within the last 5 minutes.
    const recent = await sql`
      SELECT fetched_at FROM x_posts
      ORDER BY fetched_at DESC
      LIMIT 1
    `
    if (recent.length > 0) {
      const lastFetch = new Date(recent[0].fetched_at as string)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      if (lastFetch > fiveMinutesAgo) {
        return { success: true, message: "Fetched recently, skipping", count: 0 }
      }
    }

    // Fetch the latest tweet from each handle in parallel.
    const results = await Promise.all(HANDLES.map((h) => fetchLatestTweet(h)))
    const posts = results.filter((p): p is FetchedPost => p !== null)

    if (posts.length === 0) {
      return { success: true, message: "No posts fetched", count: 0 }
    }

    // Upsert. On conflict (same tweet id) just refresh fetched_at, keeping
    // the original created_at so ordering by recency stays stable.
    for (const post of posts) {
      await sql`
        INSERT INTO x_posts (id, handle, name, text, url, created_at, fetched_at)
        VALUES (${post.id}, ${post.handle}, ${post.name}, ${post.text}, ${post.url}, ${post.timestamp}, NOW())
        ON CONFLICT (id)
        DO UPDATE SET fetched_at = NOW()
      `
    }

    // Keep only the newest 20 by created_at.
    await sql`
      DELETE FROM x_posts
      WHERE id NOT IN (
        SELECT id FROM x_posts
        ORDER BY created_at DESC
        LIMIT 20
      )
    `

    return { success: true, message: `Stored ${posts.length} posts`, count: posts.length }
  } catch (err) {
    console.error("[cron/fetch-x-posts] Error:", err instanceof Error ? err.message : String(err))
    return {
      success: false,
      message: err instanceof Error ? err.message : "Unknown error",
      count: 0,
    }
  }
}

export async function GET(request: Request) {
  const auth = request.headers.get("authorization")
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const result = await checkAndFetchPosts()
  return NextResponse.json(result)
}