import { parseUnits } from 'viem'

export const STAKING_CONTRACT = '0xf8D685d7ABD92E7225D09f13088C5c420aff3b3C'
export const SMAUG_TOKEN = '0xf4754Aa585caBf38537A68660469A17E203D8632'

export const STAKING_ABI = [
  {
    inputs: [],
    name: 'totalStaked',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalWeightedStake',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalStakers',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'stakeCount',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'index', type: 'uint256' },
    ],
    name: 'userStakeIds',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'minStakeAmount',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'duration', type: 'uint256' },
    ],
    name: 'stake',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'stakeId', type: 'uint256' }],
    name: 'unstake',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'stakeId', type: 'uint256' }],
    name: 'stakes',
    outputs: [
      { name: 'owner', type: 'address' },
      { name: 'amountStaked', type: 'uint256' },
      { name: 'stakeStartTime', type: 'uint256' },
      { name: 'endTime', type: 'uint256' },
      { name: 'tierIndex', type: 'uint256' },
      { name: 'weightedAmount', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'stakeId', type: 'uint256' }],
    name: 'pendingPLS',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'stakeId', type: 'uint256' }],
    name: 'pendingSmaugReward',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'stakeId', type: 'uint256' }],
    name: 'pendingSmaugReflection',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'stakeId', type: 'uint256' }],
    name: 'estimateClaimPenalty',
    outputs: [
      { name: 'keepPct', type: 'uint256' },
      { name: 'timeRemaining', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'stakeId', type: 'uint256' }],
    name: 'claimRewards',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'stakeId', type: 'uint256' }],
    name: 'processBurn',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'stakeId', type: 'uint256' }],
    name: 'principalRemaining',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'd', type: 'uint256' }],
    name: 'multiplierForDuration',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'smaugBurnReserve',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'minBurnThreshold',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'user', type: 'address' },
      { indexed: true, name: 'stakeId', type: 'uint256' },
      { indexed: false, name: 'plsKept', type: 'uint256' },
      { indexed: false, name: 'plsForfeited', type: 'uint256' },
      { indexed: false, name: 'smaugKept', type: 'uint256' },
      { indexed: false, name: 'smaugForfeited', type: 'uint256' },
      { indexed: false, name: 'reflectionKept', type: 'uint256' },
      { indexed: false, name: 'reflectionForfeited', type: 'uint256' },
    ],
    name: 'RewardClaimed',
    type: 'event',
  },
] as const

export const ERC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

export function formatSmaugBalance(balance: bigint): string {
  return (Number(balance) / 1e18).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

export function parseSmaugAmount(amount: string): bigint {
  return parseUnits(amount, 18)
}