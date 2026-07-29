import { NextResponse } from "next/server"

const HANDLES = [
  "OpusEco",
  "RichardHeartWin",
  "CryptoCoffee369",
] as const

const POSTS_PER_ACCOUNT = 3
const FETCH_TIMEOUT_MS = 5_000

export interface FeedXPost {
  id: string
  handle: string
  name: string
  text: string
  url: string
  timestamp: string
}

interface VXTwitterResponse {
  tweetID?: string | number
  tweetURL?: string
  text?: string
  date?: string
  date_epoch?: number | string
  user_name?: string
  user_screen_name?: string
}

interface FeedCache {
  postsByHandle: Map<string, FeedXPost[]>
}

declare global {
  var xFeedCache: FeedCache | undefined
}

const feedCache: FeedCache =
  globalThis.xFeedCache ??
  {
    postsByHandle: new Map<string, FeedXPost[]>(),
  }

globalThis.xFeedCache = feedCache

function parseTimestamp(data: VXTwitterResponse): string {
  if (data.date_epoch !== undefined) {
    const epoch = Number(data.date_epoch)

    if (Number.isFinite(epoch)) {
      return new Date(epoch * 1000).toISOString()
    }
  }

  if (data.date) {
    const parsed = new Date(data.date)

    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString()
    }
  }

  return new Date().toISOString()
}

async function fetchLatestPost(handle: string): Promise<FeedXPost> {
  const controller = new AbortController()
  const timeoutId = setTimeout(
    () => controller.abort(),
    FETCH_TIMEOUT_MS
  )

  try {
    const response = await fetch(
      `https://api.vxtwitter.com/${encodeURIComponent(handle)}`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "OpusEcosystemFeed/1.0",
        },
        signal: controller.signal,

        // Fetch a fresh latest post at most once every five minutes.
        next: {
          revalidate: 300,
        },
      }
    )

    if (!response.ok) {
      const body = await response.text()

      throw new Error(
        `VXTwitter returned ${response.status}: ${body.slice(0, 200)}`
      )
    }

    const data = (await response.json()) as VXTwitterResponse

    const tweetId = String(data.tweetID ?? "").trim()

    if (!tweetId) {
      throw new Error(
        `VXTwitter response for @${handle} did not contain tweetID`
      )
    }

    const returnedHandle =
      String(data.user_screen_name ?? handle).trim() || handle

    return {
      id: tweetId,
      handle: returnedHandle,
      name:
        String(data.user_name ?? returnedHandle).trim() ||
        returnedHandle,
      text:
        String(data.text ?? "").trim() ||
        "View this post on X",
      url:
        String(data.tweetURL ?? "").trim() ||
        `https://x.com/${returnedHandle}/status/${tweetId}`,
      timestamp: parseTimestamp(data),
    }
  } catch (error) {
    if (
      error instanceof Error &&
      error.name === "AbortError"
    ) {
      throw new Error(
        `VXTwitter request for @${handle} timed out`
      )
    }

    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

function storePost(
  requestedHandle: string,
  post: FeedXPost
): FeedXPost[] {
  const cacheKey = requestedHandle.toLowerCase()
  const existing =
    feedCache.postsByHandle.get(cacheKey) ?? []

  const withoutDuplicate = existing.filter(
    (savedPost) => savedPost.id !== post.id
  )

  const updated = [post, ...withoutDuplicate]
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() -
        new Date(a.timestamp).getTime()
    )
    .slice(0, POSTS_PER_ACCOUNT)

  feedCache.postsByHandle.set(cacheKey, updated)

  return updated
}

export async function GET() {
  const results = await Promise.allSettled(
    HANDLES.map(async (handle) => {
      const latestPost = await fetchLatestPost(handle)
      return {
        handle,
        posts: storePost(handle, latestPost),
      }
    })
  )

  const errors: string[] = []

  results.forEach((result, index) => {
    if (result.status === "rejected") {
      errors.push(
        `@${HANDLES[index]}: ${
          result.reason instanceof Error
            ? result.reason.message
            : String(result.reason)
        }`
      )
    }
  })

  /*
   * Include cached posts even when today's VXTwitter request fails.
   */
  const posts = HANDLES.flatMap((handle) => {
    return (
      feedCache.postsByHandle.get(handle.toLowerCase()) ?? []
    )
  }).sort(
    (a, b) =>
      new Date(b.timestamp).getTime() -
      new Date(a.timestamp).getTime()
  )

  return NextResponse.json(
    {
      posts,
      errors,
      postsPerAccount: Object.fromEntries(
        HANDLES.map((handle) => [
          handle,
          (
            feedCache.postsByHandle.get(
              handle.toLowerCase()
            ) ?? []
          ).length,
        ])
      ),
    },
    {
      headers: {
        /*
         * Prevent every visitor from triggering three VXTwitter calls.
         * Vercel can serve the same response for five minutes.
         */
        "Cache-Control":
          "public, s-maxage=300, stale-while-revalidate=600",
      },
    }
  )
}