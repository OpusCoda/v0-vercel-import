import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"

const sql = neon(process.env.DATABASE_URL!)

interface XApiPost {
  id: string
  handle: string
  name: string
  text: string
  url: string
  timestamp: string
}

async function fetchXPosts(): Promise<XApiPost[]> {
  try {
    const response = await fetch("/api/x-posts", {
      method: "GET",
      cache: "no-store",
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error ?? "Failed to fetch X posts")
    }

    return data.posts ?? []
  } catch (err) {
    console.error("[cron/fetch-x-posts] Failed to fetch X posts:", err)
    return []
  }
}

async function checkAndFetchPosts(): Promise<{ success: boolean; message: string; count: number }> {
  try {
    // Check if we need to fetch (last fetch is older than 5 minutes)
    const result = await sql`
      SELECT fetched_at FROM x_posts 
      ORDER BY fetched_at DESC 
      LIMIT 1
    `

    const lastFetch = result.length > 0 ? new Date(result[0].fetched_at) : null
    const now = new Date()
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)

    if (lastFetch && lastFetch > fiveMinutesAgo) {
      return {
        success: true,
        message: "Posts were fetched recently, skipping",
        count: 0,
      }
    }

    // Fetch new posts from X
    const posts = await fetchXPosts()

    if (posts.length === 0) {
      return {
        success: true,
        message: "No new posts fetched",
        count: 0,
      }
    }

    // Upsert posts (insert or update if ID exists)
    for (const post of posts) {
      await sql`
        INSERT INTO x_posts (id, handle, name, text, url, created_at, fetched_at)
        VALUES (${post.id}, ${post.handle}, ${post.name}, ${post.text}, ${post.url}, ${post.timestamp}, NOW())
        ON CONFLICT (id) 
        DO UPDATE SET fetched_at = NOW()
      `
    }

    // Delete all but newest 20 posts
    await sql`
      DELETE FROM x_posts 
      WHERE id NOT IN (
        SELECT id FROM x_posts 
        ORDER BY created_at DESC 
        LIMIT 20
      )
    `

    return {
      success: true,
      message: `Fetched and stored ${posts.length} posts`,
      count: posts.length,
    }
  } catch (err) {
    console.error("[cron/fetch-x-posts] Error:", err)
    return {
      success: false,
      message: err instanceof Error ? err.message : "Unknown error",
      count: 0,
    }
  }
}

export async function GET(request: Request) {
  // Verify this is from Vercel cron or internal
  const auth = request.headers.get("authorization")
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const result = await checkAndFetchPosts()
  return NextResponse.json(result)
}
