// lib/auto-compounder.ts
import type { Address } from "viem"

export const VAULTS = {
  OPUS: {
    key: "OPUS" as const,
    vault: "0xEf5B436f6832F19D34b81897FFAE0751c6612830" as Address,
    token: "0x9B5a65E37f338ADD1263530DDac8CEc56204bB3a" as Address,
    tokenSymbol: "OPUS",
    rewardSymbol: "PLS",
    rewardToken: null,
    deployBlock: 27509909n,
  },
  CODA: {
    key: "CODA" as const,
    vault: "0x630ce372979B784db03e277A7c888D1A8b47819E" as Address,
    token: "0x9F8d74dF6DD3145e858578B0bE1d9B11f41E0A28" as Address,
    tokenSymbol: "CODA",
    rewardSymbol: "PLSX",
    rewardToken: "0x95B303987A60C71504D99Aa1b13B4DA07b0790ab" as Address,
    deployBlock: 27509915n,
  },
} as const

export type VaultKey = keyof typeof VAULTS

export const SMAUG_ADDRESS =
  "0xf4754Aa585caBf38537A68660469A17E203D8632" as Address

export const MIN_COMPOUND_PCT = 5

export const VAULT_ABI = [
  {
    type: "function",
    name: "positionOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [
      { name: "principal", type: "uint256" },
      { name: "smaugInWallet", type: "uint256" },
      { name: "tier", type: "uint256" },
      { name: "weight", type: "uint256" },
      { name: "pendingIn", type: "uint256" },
      { name: "claimableNow", type: "uint256" },
      { name: "compoundPct", type: "uint8" },
    ],
  },
  { type: "function", name: "vaultTier", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "totalPrincipal", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "depositorCount", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "smaugCirculating", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },

  // ── Vault-wide stats ──────────────────────────────────────────────
  // totalCompoundWeight / totalWeight is the reinvestment rate weighted by
  // position size — there is no stored average, it is derived from these.
  { type: "function", name: "totalWeight", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "totalCompoundWeight", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "totalClaimWeight", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },

  // Reward waiting to be compounded. sweepableRewards() is what the vault
  // already holds; unpaidEarnings() is what the distributor still owes it.
  // compound() harvests before it splits, so the sum is what the next run
  // will actually act on.
  { type: "function", name: "sweepableRewards", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "unpaidEarnings", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },

  // Protocol surplus: the gap between what the vault collects at its own
  // Smaug tier and what its members are individually entitled to, in basis
  // points of incoming rewards. Falls toward zero as depositors' own Smaug
  // holdings approach the 1.20x cap.
  { type: "function", name: "surplusBps", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "accruedSurplus", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },

  {
    type: "function",
    name: "tierFor",
    stateMutability: "view",
    inputs: [{ name: "smaugAmount", type: "uint256" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "deposit",
    stateMutability: "nonpayable",
    inputs: [{ name: "principalAmount", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "withdraw",
    stateMutability: "nonpayable",
    inputs: [{ name: "principalAmount", type: "uint256" }],
    outputs: [],
  },
  { type: "function", name: "withdrawAll", stateMutability: "nonpayable", inputs: [], outputs: [] },
  {
    type: "function",
    name: "setCompoundPct",
    stateMutability: "nonpayable",
    inputs: [{ name: "pct", type: "uint8" }],
    outputs: [],
  },
  { type: "function", name: "claim", stateMutability: "nonpayable", inputs: [], outputs: [] },
  {
    type: "function",
    name: "refreshWeight",
    stateMutability: "nonpayable",
    inputs: [{ name: "account", type: "address" }],
    outputs: [],
  },
] as const

/** Emitted whenever a position settles. `compounded` is principal folded in. */
export const SETTLED_EVENT = {
  type: "event",
  name: "Settled",
  inputs: [
    { name: "user", type: "address", indexed: true },
    { name: "compounded", type: "uint256", indexed: false },
    { name: "rewardAccrued", type: "uint256", indexed: false },
  ],
} as const

/** Emitted when a user takes their reward token. */
export const CLAIMED_EVENT = {
  type: "event",
  name: "Claimed",
  inputs: [
    { name: "user", type: "address", indexed: true },
    { name: "amount", type: "uint256", indexed: false },
  ],
} as const

/** Emitted once per successful compound. Indexed for "last compounded". */
export const COMPOUNDED_EVENT = {
  type: "event",
  name: "Compounded",
  inputs: [
    { name: "rewardSpent", type: "uint256", indexed: false },
    { name: "principalReceived", type: "uint256", indexed: false },
  ],
} as const

export const ERC20_ABI = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
] as const

/** The distributor's tier ladder, mirrored for the "next tier" helper. */
export const TIER_LADDER: { ppm: bigint; tier: number }[] = [
  { ppm: 10_000n, tier: 120 },
  { ppm: 5_000n, tier: 119 },
  { ppm: 2_500n, tier: 117 },
  { ppm: 1_000n, tier: 115 },
  { ppm: 500n, tier: 112 },
  { ppm: 150n, tier: 110 },
  { ppm: 50n, tier: 108 },
  { ppm: 10n, tier: 106 },
  { ppm: 5n, tier: 104 },
  { ppm: 1n, tier: 102 },
]

/** SMAUG a wallet needs to hold to reach the next tier above `currentTier`. */
export function smaugForNextTier(
  currentTier: number,
  circulating: bigint,
): { tier: number; smaug: bigint } | null {
  const higher = [...TIER_LADDER]
    .filter((t) => t.tier > currentTier)
    .sort((a, b) => a.tier - b.tier)[0]
  if (!higher) return null
  return { tier: higher.tier, smaug: (circulating * higher.ppm) / 1_000_000n }
}

export function formatTier(tier: number | bigint): string {
  return `${(Number(tier) / 100).toFixed(2)}×`
}

/**
 * Reinvestment rate across the vault, weighted by position size.
 *
 * Not a plain average of depositors — a large position at 25% moves this far
 * more than a small one at 100%. Returns null until both reads land.
 */
export function weightedCompoundPct(
  totalCompoundWeight: bigint | undefined,
  totalWeight: bigint | undefined,
): number | null {
  if (totalWeight === undefined || totalCompoundWeight === undefined) return null
  if (totalWeight === 0n) return null
  return Number((totalCompoundWeight * 10_000n) / totalWeight) / 100
}

/** "3 hours ago" from a unix timestamp in seconds. */
export function timeAgo(unixSeconds: number): string {
  const secs = Math.max(0, Math.floor(Date.now() / 1000) - unixSeconds)
  if (secs < 90) return "just now"
  const mins = Math.round(secs / 60)
  if (mins < 60) return `${mins} min ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`
  const days = Math.round(hours / 24)
  return `${days} day${days === 1 ? "" : "s"} ago`
}