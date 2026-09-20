// lib/yield.ts
import type { Address } from "viem"

export const VAULTS = {
  OPUS: {
    key: "OPUS" as const,
    principal: "OPUS" as const,
    vault: "0xEf5B436f6832F19D34b81897FFAE0751c6612830" as Address,
    token: "0x9B5a65E37f338ADD1263530DDac8CEc56204bB3a" as Address,
    tokenSymbol: "OPUS",
    rewardSymbol: "PLS",
    rewardToken: null,
    rewardDecimals: 18,
    targetSymbol: "PLS",
    targetDecimals: 18,
    isConverter: false,
    defaultCompoundPct: 100,
    minCompoundPct: 5,
    deployBlock: 27509909n,
  },
  CODA: {
    key: "CODA" as const,
    principal: "CODA" as const,
    vault: "0x630ce372979B784db03e277A7c888D1A8b47819E" as Address,
    token: "0x9F8d74dF6DD3145e858578B0bE1d9B11f41E0A28" as Address,
    tokenSymbol: "CODA",
    rewardSymbol: "PLSX",
    rewardToken: "0x95B303987A60C71504D99Aa1b13B4DA07b0790ab" as Address,
    rewardDecimals: 18,
    targetSymbol: "PLSX",
    targetDecimals: 18,
    isConverter: false,
    defaultCompoundPct: 100,
    minCompoundPct: 5,
    deployBlock: 27509915n,
  },
  OPUS_HEX: {
    key: "OPUS_HEX" as const,
    principal: "OPUS" as const,
    vault: "0x622ecC19e2c6c17758a46939C99e0677646AB708" as Address,
    token: "0x9B5a65E37f338ADD1263530DDac8CEc56204bB3a" as Address, // deposit token is still OPUS
    tokenSymbol: "OPUS",
    rewardSymbol: "PLS",
    rewardToken: null,
    rewardDecimals: 18,
    targetSymbol: "HEX",     // what claim() actually pays out
    targetDecimals: 8,
    isConverter: true,
    defaultCompoundPct: 50,
    minCompoundPct: 0, 
    deployBlock: 27560033n,
  },
  OPUS_EHEX: {
    key: "OPUS_EHEX" as const,
    principal: "OPUS" as const,
    vault: "0x37d2553bF2F80333FBDAED37c989131859bBa994" as Address,
    token: "0x9B5a65E37f338ADD1263530DDac8CEc56204bB3a" as Address, // deposit token is still OPUS
    tokenSymbol: "OPUS",
    rewardSymbol: "PLS",
    rewardToken: null,
    rewardDecimals: 18,
    targetSymbol: "EHEX",
    targetDecimals: 8,
    isConverter: true,
    defaultCompoundPct: 50,
    minCompoundPct: 0, 
    deployBlock: 27566962n,
  },
  OPUS_INC: {
    key: "OPUS_INC" as const,
    principal: "OPUS" as const,
    vault: "0x39f49E51069954A80e44559857EB07b72dDE5196" as Address,
    token: "0x9B5a65E37f338ADD1263530DDac8CEc56204bB3a" as Address,
    tokenSymbol: "OPUS",
    rewardSymbol: "PLS",
    rewardToken: null,
    rewardDecimals: 18,
    targetSymbol: "INC",
    targetDecimals: 18,
    isConverter: true,
    defaultCompoundPct: 50,
    minCompoundPct: 0, 
    deployBlock: 27567276n,
  },
  OPUS_PRVX: {
    key: "OPUS_PRVX" as const,
    principal: "OPUS" as const,
    vault: "0x8da8F78B5Bc207A83dfe11bC167857C8F4eFef55" as Address,
    token: "0x9B5a65E37f338ADD1263530DDac8CEc56204bB3a" as Address,
    tokenSymbol: "OPUS",
    rewardSymbol: "PLS",
    rewardToken: null,
    rewardDecimals: 18,
    targetSymbol: "PRVX",
    targetDecimals: 18,
    isConverter: true,
    defaultCompoundPct: 50,
    minCompoundPct: 0, 
    deployBlock: 27567367n,
  },
  CODA_PWBTC: {
    key: "CODA_PWBTC" as const,
    principal: "CODA" as const,
    vault: "0xea7322A5D3e4e4b266e3D6722D43fEC2CB525b33" as Address,
    token: "0x9F8d74dF6DD3145e858578B0bE1d9B11f41E0A28" as Address, // deposit token is CODA
    tokenSymbol: "CODA",
    rewardSymbol: "PLSX",
    rewardToken: "0x95B303987A60C71504D99Aa1b13B4DA07b0790ab" as Address,
    rewardDecimals: 18,
    targetSymbol: "pWBTC",
    targetDecimals: 8,
    isConverter: true,
    defaultCompoundPct: 50,
    minCompoundPct: 0, 
    deployBlock: 27567635n,
  },
  CODA_PDAI: {
    key: "CODA_PDAI" as const,
    principal: "CODA" as const,
    vault: "0xaAeee3E41B0fa08Bcb3Ae70369AC4eFA25aC8370" as Address,
    token: "0x9F8d74dF6DD3145e858578B0bE1d9B11f41E0A28" as Address,
    tokenSymbol: "CODA",
    rewardSymbol: "PLSX",
    rewardToken: "0x95B303987A60C71504D99Aa1b13B4DA07b0790ab" as Address,
    rewardDecimals: 18,
    targetSymbol: "pDAI",
    targetDecimals: 18,
    isConverter: true,
    defaultCompoundPct: 50,
    minCompoundPct: 0,
    deployBlock: 27594446n,
  },
  CODA_FINVESTA: {
    key: "CODA_FINVESTA" as const,
    principal: "CODA" as const,
    vault: "0x2ac85128486fC2d75a539Dc24Df9969d57049be7" as Address,
    token: "0x9F8d74dF6DD3145e858578B0bE1d9B11f41E0A28" as Address,
    tokenSymbol: "CODA",
    rewardSymbol: "PLSX",
    rewardToken: "0x95B303987A60C71504D99Aa1b13B4DA07b0790ab" as Address,
    rewardDecimals: 18,
    targetSymbol: "FINVESTA",
    targetDecimals: 8,
    isConverter: true,
    defaultCompoundPct: 50,
    minCompoundPct: 0,
    deployBlock: 27595544n,
  },
} as const

export type VaultKey = keyof typeof VAULTS
export type PrincipalKey = "OPUS" | "CODA"

export const PRINCIPALS: PrincipalKey[] = ["OPUS", "CODA"]

/** All vault keys whose principal token matches, in declaration order. */
export function vaultsForPrincipal(principal: PrincipalKey): VaultKey[] {
  return (Object.keys(VAULTS) as VaultKey[]).filter(
    (k) => VAULTS[k].principal === principal,
  )
}

/**
 * Addresses excluded when working out effective circulating supply.
 * OPUS_HEX reuses OPUS's list — same token, same non-circulating addresses,
 * regardless of which vault happens to be holding deposits of it.
 */
export const CIRCULATING_EXCLUSIONS: Record<VaultKey, Address[]> = {
  OPUS: [
    "0x0000000000000000000000000000000000000369",
    "0x9B5a65E37f338ADD1263530DDac8CEc56204bB3a",
    "0x15dD01082095F1234f48AC920997621D66687972",
    "0x542Cc63EceD96F89D61B3cF727f3E87e67eC7d93",
    "0xFe7cf37AbaA78DA00B83C10fCc635083EA446330",
    "0x0C24Ac492a01F8ddC9776f448A58De574C0eEdbE",
  ] as Address[],
  CODA: [
    "0x0000000000000000000000000000000000000369",
    "0x9F8d74dF6DD3145e858578B0bE1d9B11f41E0A28",
    "0xaA73Ad940094d0453AE547f1aCB7eB00A49f729e",
    "0x85Dc2c3B8b6f341227a461212DFf59c4fF08AFb3",
    "0xFe7cf37AbaA78DA00B83C10fCc635083EA446330",
    "0x2694f6cB721396256418f33f68700c9a7029A9c1",
  ] as Address[],
  OPUS_HEX: [
    "0x0000000000000000000000000000000000000369",
    "0x9B5a65E37f338ADD1263530DDac8CEc56204bB3a",
    "0x15dD01082095F1234f48AC920997621D66687972",
    "0x542Cc63EceD96F89D61B3cF727f3E87e67eC7d93",
    "0xFe7cf37AbaA78DA00B83C10fCc635083EA446330",
    "0x0C24Ac492a01F8ddC9776f448A58De574C0eEdbE",
  ] as Address[],
  OPUS_EHEX: [
    "0x0000000000000000000000000000000000000369",
    "0x9B5a65E37f338ADD1263530DDac8CEc56204bB3a",
    "0x15dD01082095F1234f48AC920997621D66687972",
    "0x542Cc63EceD96F89D61B3cF727f3E87e67eC7d93",
    "0xFe7cf37AbaA78DA00B83C10fCc635083EA446330",
    "0x0C24Ac492a01F8ddC9776f448A58De574C0eEdbE",
  ] as Address[],
  OPUS_INC: [
    "0x0000000000000000000000000000000000000369",
    "0x9B5a65E37f338ADD1263530DDac8CEc56204bB3a",
    "0x15dD01082095F1234f48AC920997621D66687972",
    "0x542Cc63EceD96F89D61B3cF727f3E87e67eC7d93",
    "0xFe7cf37AbaA78DA00B83C10fCc635083EA446330",
    "0x0C24Ac492a01F8ddC9776f448A58De574C0eEdbE",
  ] as Address[],
  OPUS_PRVX: [
    "0x0000000000000000000000000000000000000369",
    "0x9B5a65E37f338ADD1263530DDac8CEc56204bB3a",
    "0x15dD01082095F1234f48AC920997621D66687972",
    "0x542Cc63EceD96F89D61B3cF727f3E87e67eC7d93",
    "0xFe7cf37AbaA78DA00B83C10fCc635083EA446330",
    "0x0C24Ac492a01F8ddC9776f448A58De574C0eEdbE",
  ] as Address[],
  CODA_PWBTC: [
    "0x0000000000000000000000000000000000000369",
    "0x9F8d74dF6DD3145e858578B0bE1d9B11f41E0A28",
    "0xaA73Ad940094d0453AE547f1aCB7eB00A49f729e",
    "0x85Dc2c3B8b6f341227a461212DFf59c4fF08AFb3",
    "0xFe7cf37AbaA78DA00B83C10fCc635083EA446330",
    "0x2694f6cB721396256418f33f68700c9a7029A9c1",
  ] as Address[],
  CODA_PDAI: [
    "0x0000000000000000000000000000000000000369",
    "0x9F8d74dF6DD3145e858578B0bE1d9B11f41E0A28",
    "0xaA73Ad940094d0453AE547f1aCB7eB00A49f729e",
    "0x85Dc2c3B8b6f341227a461212DFf59c4fF08AFb3",
    "0xFe7cf37AbaA78DA00B83C10fCc635083EA446330",
    "0x2694f6cB721396256418f33f68700c9a7029A9c1",
  ] as Address[],
  CODA_FINVESTA: [
    "0x0000000000000000000000000000000000000369",
    "0x9F8d74dF6DD3145e858578B0bE1d9B11f41E0A28",
    "0xaA73Ad940094d0453AE547f1aCB7eB00A49f729e",
    "0x85Dc2c3B8b6f341227a461212DFf59c4fF08AFb3",
    "0xFe7cf37AbaA78DA00B83C10fCc635083EA446330",
    "0x2694f6cB721396256418f33f68700c9a7029A9c1",
  ] as Address[],
}

export const SMAUG_ADDRESS =
  "0xf4754Aa585caBf38537A68660469A17E203D8632" as Address

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

  { type: "function", name: "totalWeight", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "totalCompoundWeight", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "totalClaimWeight", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },

  { type: "function", name: "sweepableRewards", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "unpaidEarnings", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },

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

  // ── Converter-vault only (OPUS_HEX etc.) ─────────────────────────
  { type: "function", name: "pendingTargetConversion", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  {
    type: "function",
    name: "quoteConvert",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "amountIn", type: "uint256" },
      { name: "amountOut", type: "uint256" },
    ],
  },
] as const

export const SETTLED_EVENT = {
  type: "event",
  name: "Settled",
  inputs: [
    { name: "user", type: "address", indexed: true },
    { name: "compounded", type: "uint256", indexed: false },
    { name: "rewardAccrued", type: "uint256", indexed: false },
  ],
} as const

export const CLAIMED_EVENT = {
  type: "event",
  name: "Claimed",
  inputs: [
    { name: "user", type: "address", indexed: true },
    { name: "amount", type: "uint256", indexed: false },
  ],
} as const

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
    name: "totalSupply",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
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

export function weightedCompoundPct(
  totalCompoundWeight: bigint | undefined,
  totalWeight: bigint | undefined,
): number | null {
  if (totalWeight === undefined || totalCompoundWeight === undefined) return null
  if (totalWeight === 0n) return null
  return Number((totalCompoundWeight * 10_000n) / totalWeight) / 100
}

export function vaultShareOfCirculating(
  totalPrincipal: bigint | undefined,
  totalSupply: bigint | undefined,
  excludedBalances: (bigint | undefined)[],
): number | null {
  if (totalPrincipal === undefined || totalSupply === undefined) return null
  if (excludedBalances.some((b) => b === undefined)) return null

  const excluded = excludedBalances.reduce<bigint>((sum, b) => sum + (b ?? 0n), 0n)
  if (excluded >= totalSupply) return null
  const circulating = totalSupply - excluded
  if (circulating === 0n) return null

  return Number((totalPrincipal * 1_000_000n) / circulating) / 10_000
}

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