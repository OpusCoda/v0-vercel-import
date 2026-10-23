import { NextResponse } from "next/server"
import { createPublicClient, defineChain, http } from "viem"
import { CLAIMED_EVENT, SETTLED_EVENT, VAULTS, type VaultKey } from "@/lib/yield"
import { BUDGET_MS, COOLDOWN_MS, keys, redis } from "@/lib/yield-store"

export const runtime = "nodejs"
export const maxDuration = 60

const chain = defineChain({
  id: 369,
  name: "PulseChain",
  nativeCurrency: { name: "Pulse", symbol: "PLS", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.pulsechain.com"] } },
})
const client = createPublicClient({ chain, transport: http("https://rpc.pulsechain.com") })
const CHUNK = 9_000n

type Delta = { claimed: bigint; compounded: bigint }

async function applyDelta(user: string, vault: VaultKey, delta: Delta) {
  const key = keys.user(user)
  const [claimed, compounded] = await Promise.all([
    redis.hget<string>(key, `${vault}:claimed`),
    redis.hget<string>(key, `${vault}:compounded`),
  ])
  await redis.hset(key, {
    [`${vault}:claimed`]: (BigInt(claimed ?? "0") + delta.claimed).toString(),
    [`${vault}:compounded`]: (BigInt(compounded ?? "0") + delta.compounded).toString(),
  })
}

export async function POST() {
  const started = Date.now()
  const [updated, done] = await Promise.all([
    redis.get<string>(keys.updated),
    redis.get<string>(keys.done),
  ])
  if (done === "1" && updated && Date.now() - Number(updated) < COOLDOWN_MS) {
    return NextResponse.json({ skipped: true, updatedAt: Number(updated) })
  }

  const locked = await redis.set(keys.lock, "1", { nx: true, px: 90_000 })
  if (!locked) return NextResponse.json({ busy: true })

  try {
    const latest = await client.getBlockNumber()
    let allDone = true

    for (const vault of Object.keys(VAULTS) as VaultKey[]) {
      const config = VAULTS[vault]
      const lastRaw = await redis.get<string>(keys.last(config.vault))
      let from = lastRaw ? BigInt(lastRaw) + 1n : BigInt(config.deployBlock)

      while (from <= latest) {
        if (Date.now() - started > BUDGET_MS) break
        const to = from + CHUNK - 1n > latest ? latest : from + CHUNK - 1n
        const [claims, settles] = await Promise.all([
          client.getLogs({ address: config.vault, event: CLAIMED_EVENT, fromBlock: from, toBlock: to }),
          client.getLogs({ address: config.vault, event: SETTLED_EVENT, fromBlock: from, toBlock: to }),
        ])

        const deltas = new Map<string, Delta>()
        const bump = (user: string, field: keyof Delta, amount: bigint) => {
          const normalized = user.toLowerCase()
          const delta = deltas.get(normalized) ?? { claimed: 0n, compounded: 0n }
          delta[field] += amount
          deltas.set(normalized, delta)
        }
        for (const log of claims) bump(log.args.user!, "claimed", log.args.amount ?? 0n)
        for (const log of settles) bump(log.args.user!, "compounded", log.args.compounded ?? 0n)

        await Promise.all([...deltas].map(([user, delta]) => applyDelta(user, vault, delta)))
        await redis.set(keys.last(config.vault), to.toString())
        from = to + 1n
      }

      if (from <= latest) allDone = false
    }

    await redis.set(keys.updated, String(Date.now()))
    await redis.set(keys.done, allDone ? "1" : "0")
    return NextResponse.json({ done: allDone, latest: latest.toString() })
  } finally {
    await redis.del(keys.lock)
  }
}
