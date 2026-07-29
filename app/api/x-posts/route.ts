import { NextResponse } from "next/server"

const HANDLES = [
  "OpusEco",
  "RichardHeartWin",
  "CryptoCoffee369",
] as const

const POSTS_PER_ACCOUNT = 3

interface XUser {
  id: string
  name: string
  username: string
}

interface XPost {
  id: string
  text: string
  created_at?: string
}

interface XUserLookupResponse {
  data?: XUser
  errors?: Array<{
    detail?: string
    title?: string
  }>
}

interface XTimelineResponse {
  data?: XPost[]
  errors?: Array<{
    detail?: string
    title?: string
  }>
}

export interface FeedXPost {
  id: string
  handle: string
  name: string
  text: string
  url: string
  timestamp: string
}

async function xFetch<T>(
  url: string,
  bearerToken: string
): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${bearerToken}`,
    },
    next: {
      revalidate: 300,
    },
  })

  if (!response.ok) {
    const body = await response.text()

    throw new Error(
      `X API returned ${response.status}: ${body.slice(0, 300)}`
    )
  }

  return response.json() as Promise<T>
}

async function fetchPostsForHandle(
  handle: string,
  bearerToken: string
): Promise<FeedXPost[]> {
  const userUrl =
    `https://api.x.com/2/users/by/username/${encodeURIComponent(handle)}` +
    `?user.fields=name,username`

  const userResponse = await xFetch<XUserLookupResponse>(
    userUrl,
    bearerToken
  )

  if (!userResponse.data) {
    throw new Error(
      userResponse.errors?.[0]?.detail ??
        `Could not find X account @${handle}`
    )
  }

  const user = userResponse.data

  // X currently requires max_results to be at least 5.
  const timelineUrl =
    `https://api.x.com/2/users/${user.id}/tweets` +
    `?max_results=5` +
    `&tweet.fields=created_at` +
    `&exclude=replies,retweets`

  const timelineResponse = await xFetch<XTimelineResponse>(
    timelineUrl,
    bearerToken
  )

  return (timelineResponse.data ?? [])
    .slice(0, POSTS_PER_ACCOUNT)
    .map((post) => ({
      id: post.id,
      handle: user.username,
      name: user.name,
      text: post.text,
      url: `https://x.com/${user.username}/status/${post.id}`,
      timestamp: post.created_at ?? new Date().toISOString(),
    }))
}

export async function GET() {
  const bearerToken = process.env.X_BEARER_TOKEN

  if (!bearerToken) {
    return NextResponse.json(
      {
        error: "X_BEARER_TOKEN is not configured.",
      },
      {
        status: 500,
      }
    )
  }

  const results = await Promise.allSettled(
    HANDLES.map((handle) =>
      fetchPostsForHandle(handle, bearerToken)
    )
  )

  const posts: FeedXPost[] = []
  const errors: string[] = []

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      posts.push(...result.value)
      return
    }

    errors.push(
      `@${HANDLES[index]}: ${
        result.reason instanceof Error
          ? result.reason.message
          : String(result.reason)
      }`
    )
  })

  posts.sort(
    (a, b) =>
      new Date(b.timestamp).getTime() -
      new Date(a.timestamp).getTime()
  )

  return NextResponse.json(
    {
      posts,
      errors,
    },
    {
      headers: {
        "Cache-Control":
          "public, s-maxage=300, stale-while-revalidate=600",
      },
    }
  )
}
