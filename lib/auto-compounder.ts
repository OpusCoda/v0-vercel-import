// lib/auto-compounder.ts
import type { Address } from "viem"

/** Fill these in after deploying OpusAutoCompounder and CodaAutoCompounder. */
export const VAULTS = {
  OPUS: {
    key: "OPUS" as const,
    label: "Opus",
    vault: "0x0000000000000000000000000000000000000000" as Address, // TODO
    token: "0x9B5a65E37f338ADD1263530DDac8CEc56204bB3a" as Address,
    tokenSymbol: "OPUS",
    rewardSymbol: "PLS",
    /** Native PLS has no contract address. */
    rewardToken: null,
  },
  CODA: {
    key: "CODA" as const,
    label: "Coda",
    vault: "0x0000000000000000000000000000000000000000" as Address, // TODO
    token: "0x9F8d74dF6DD3145e858578B0bE1d9B11f41E0A28" as Address,
    tokenSymbol: "CODA",
    rewardSymbol: "PLSX",
    rewardToken: "0x95B303987A60C71504D99Aa1b13B4DA07b0790ab" as Address,
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
      { name: "smaug", type: "uint256" },
      { name: "tier", type: "uint256" },
      { name: "weight", type: "uint256" },
      { name: "pendingIn", type: "uint256" },
      { name: "claimableNow", type: "uint256" },
      { name: "compoundPct", type: "uint8" },
    ],
  },
  {
    type: "function",
    name: "vaultTier",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "tierFor",
    stateMutability: "view",
    inputs: [{ name: "smaugAmount", type: "uint256" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "smaugCirculating",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "totalPrincipal",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "totalSmaug",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "deposit",
    stateMutability: "nonpayable",
    inputs: [
      { name: "principalAmount", type: "uint256" },
      { name: "smaugAmount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "withdraw",
    stateMutability: "nonpayable",
    inputs: [
      { name: "principalAmount", type: "uint256" },
      { name: "smaugAmount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "withdrawAll",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "setCompoundPct",
    stateMutability: "nonpayable",
    inputs: [{ name: "pct", type: "uint8" }],
    outputs: [],
  },
  {
    type: "function",
    name: "claim",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
] as const

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

/** SMAUG needed to reach the next tier above `currentTier`. */
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