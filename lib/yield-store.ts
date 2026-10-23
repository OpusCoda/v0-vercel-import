import { Redis } from "@upstash/redis"

// Values are stored as strings so wei amounts keep full precision.
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN!,
  automaticDeserialization: false,
})

export const COOLDOWN_MS = 15 * 60 * 1000
export const BUDGET_MS = 40_000

export const keys = {
  updated: "yield:updated",
  done: "yield:done",
  lock: "yield:lock",
  last: (vault: string) => `yield:last:${vault.toLowerCase()}`,
  user: (addr: string) => `yield:user:${addr.toLowerCase()}`,
}
