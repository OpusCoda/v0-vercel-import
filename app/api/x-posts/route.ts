import { NextResponse } from "next/server"

interface XPost {
  id: string
  type: "x_post"
  timestamp: string
  content: {
    handle: string
    name: string
    text: string
    url: string
  }
}

export const dynamic = "force-dynamic"

export async function GET() {
  const handles = ["OpusEco", "RichardHeartWin", "CryptoCoffee369"]
  const posts: XPost[] = []

  for (const handle of handles) {
    try {
      const response = await fetch(`https://api.vxtwitter.com/${handle}`, {
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      })

      if (!response.ok) {
        console.error(`VXTwitter returned ${response.status} for ${handle}`)
        continue
      }

      const data = await response.json()
      const tweets = Array.isArray(data?.tweets) ? data.tweets : []

      for (const tweet of tweets.slice(0, 3)) {
        if (!tweet?.id) continue

        posts.push({
          id: `x_${handle}_${tweet.id}`,
          type: "x_post",
          timestamp: tweet.date
            ? new Date(tweet.date).toISOString()
            : new Date().toISOString(),
          content: {
            handle,
            name: data?.name || handle,
            text: tweet.text || "View this post on X",
            url: `https://x.com/${handle}/status/${tweet.id}`,
          },
        })
      }
    } catch (error) {
      console.error(
        `Failed to fetch posts for ${handle}:`,
        error instanceof Error ? error.message : String(error)
      )
    }
  }

  posts.sort(
    (a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  return NextResponse.json(posts)
}