export const WAGER_MARKET_ADDRESS = '0x5e1c42cd48718D090b8fB5269A202BaA84E1d2c0' as const

// -----------------------------------------------------------------------------
// Enums — MUST match the on-chain declaration order exactly.
// -----------------------------------------------------------------------------

// enum DepositWindow { H24, H48, W1, M1 }
export const DEPOSIT_WINDOWS = [
  { value: 0, label: '24 hours' },
  { value: 1, label: '48 hours' },
  { value: 2, label: '1 week' },
  { value: 3, label: '1 month' },
] as const

// enum Category { Crypto, Politics, Sports, Macro, PulseChain, Misc }
export const CATEGORIES = [
  { value: 0, label: 'Crypto' },
  { value: 1, label: 'Politics' },
  { value: 2, label: 'Sports' },
  { value: 3, label: 'Macro' },
  { value: 4, label: 'PulseChain' },
  { value: 5, label: 'Misc' },
] as const

// -----------------------------------------------------------------------------
// Fetch Oracle query IDs — price bets take a bytes32 queryId, NOT a token index.
// These are the four hardcoded, admin-approved feeds in the contract.
// -----------------------------------------------------------------------------
export const QUERY_PLS_USD =
  '0x83245f6a6a2f6458558a706270fbcc35ac3a81917602c1313d3bfa998dcc2d4b' as const
export const QUERY_PLSX_USD =
  '0x1f462c114bb52b607b9458707c8b0502712d6f9e0bcab1dd184c3db3cfde7c6e' as const
export const QUERY_HEX_USD =
  '0xd510cabcca8d9d6dd6f2b15393a383b0c4978df7e8369459d2daedef4269c42e' as const
export const QUERY_INC_USD =
  '0x4a7e4a0f0c3ddff451d40e9b2c17e3050bc412794a5e53de9bf4db692611381c' as const

// Token picker options for the price-bet form. `queryId` is what goes on-chain.
export const PRICE_BET_TOKENS = [
  { label: 'PLS', queryId: QUERY_PLS_USD },
  { label: 'PLSX', queryId: QUERY_PLSX_USD },
  { label: 'HEX', queryId: QUERY_HEX_USD },
  { label: 'INC', queryId: QUERY_INC_USD },
] as const

// -----------------------------------------------------------------------------
// ABI — subset matching the DEPLOYED contract. Regenerate from the Remix
// artifact / verified explorer source if you need every function.
// -----------------------------------------------------------------------------
export const WAGER_MARKET_ABI = [
  // --- createWager(address,string,uint256,uint8,uint256,uint8,address) payable ---
  {
    inputs: [
      { name: 'challenger', type: 'address' },
      { name: 'description', type: 'string' },
      { name: 'eventDate', type: 'uint256' },
      { name: 'depositWindow', type: 'uint8' },
      { name: 'challengerStake', type: 'uint256' },
      { name: 'category', type: 'uint8' },
      { name: 'referrer', type: 'address' },
    ],
    name: 'createWager',
    outputs: [{ name: 'wagerId', type: 'uint256' }],
    stateMutability: 'payable',
    type: 'function',
  },
  // --- createPriceBet(address,string,uint256,uint8,uint256,bytes32,uint256,bool,uint8,address) payable ---
  {
    inputs: [
      { name: 'challenger', type: 'address' },
      { name: 'description', type: 'string' },
      { name: 'eventDate', type: 'uint256' },
      { name: 'depositWindow', type: 'uint8' },
      { name: 'challengerStake', type: 'uint256' },
      { name: 'queryId', type: 'bytes32' },
      { name: 'targetPrice', type: 'uint256' },
      { name: 'creatorBetsAbove', type: 'bool' },
      { name: 'category', type: 'uint8' },
      { name: 'referrer', type: 'address' },
    ],
    name: 'createPriceBet',
    outputs: [{ name: 'wagerId', type: 'uint256' }],
    stateMutability: 'payable',
    type: 'function',
  },
  // --- acceptWager(uint256,address) payable ---
  {
    inputs: [
      { name: 'wagerId', type: 'uint256' },
      { name: 'referrer', type: 'address' },
    ],
    name: 'acceptWager',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  // --- resolvePriceBet(uint256) ---
  {
    inputs: [{ name: 'wagerId', type: 'uint256' }],
    name: 'resolvePriceBet',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // --- submitVote(uint256,address) ---
  {
    inputs: [
      { name: 'wagerId', type: 'uint256' },
      { name: 'winner', type: 'address' },
    ],
    name: 'submitVote',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // --- cancelWager(uint256) ---
  {
    inputs: [{ name: 'wagerId', type: 'uint256' }],
    name: 'cancelWager',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // --- voidWager(uint256) ---
  {
    inputs: [{ name: 'wagerId', type: 'uint256' }],
    name: 'voidWager',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // --- requiredAcceptanceAmount(uint256) view ---
  {
    inputs: [{ name: 'wagerId', type: 'uint256' }],
    name: 'requiredAcceptanceAmount',
    outputs: [
      { name: 'stake', type: 'uint256' },
      { name: 'voteDeposit', type: 'uint256' },
      { name: 'totalRequired', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  // --- getUserFeeInfo(address) view — NOTE: returns 4 flat values, not a tuple ---
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getUserFeeInfo',
    outputs: [
      { name: 'baseFeeBps', type: 'uint256' },
      { name: 'stakingRebate', type: 'uint256' },
      { name: 'referralRebate', type: 'uint256' },
      { name: 'effectiveFeeBps', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  // --- quoteWager(uint256) view ---
  {
    inputs: [{ name: 'wagerId', type: 'uint256' }],
    name: 'quoteWager',
    outputs: [
      { name: 'totalPot', type: 'uint256' },
      { name: 'creatorFee', type: 'uint256' },
      { name: 'challengerFee', type: 'uint256' },
      { name: 'winnerPayout', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  // --- getOpenWagers() view ---
  {
    inputs: [],
    name: 'getOpenWagers',
    outputs: [{ type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  // --- openWagerCount() view ---
  {
    inputs: [],
    name: 'openWagerCount',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  // --- getWagerDetails(uint256) view ---
  {
    inputs: [{ name: 'wagerId', type: 'uint256' }],
    name: 'getWagerDetails',
    outputs: [
      {
        name: 'wager',
        type: 'tuple',
        components: [
          { name: 'wagerType', type: 'uint8' },
          { name: 'category', type: 'uint8' },
          { name: 'creator', type: 'address' },
          { name: 'challenger', type: 'address' },
          { name: 'creatorStake', type: 'uint256' },
          { name: 'challengerStake', type: 'uint256' },
          { name: 'creatorVoteDeposit', type: 'uint256' },
          { name: 'challengerVoteDeposit', type: 'uint256' },
          { name: 'description', type: 'string' },
          { name: 'eventDate', type: 'uint256' },
          { name: 'depositDeadline', type: 'uint256' },
          { name: 'votingDeadline', type: 'uint256' },
          { name: 'status', type: 'uint8' },
          { name: 'creatorVote', type: 'address' },
          { name: 'challengerVote', type: 'address' },
          { name: 'winner', type: 'address' },
        ],
      },
      {
        name: 'priceBet',
        type: 'tuple',
        components: [
          { name: 'queryId', type: 'bytes32' },
          { name: 'targetPrice', type: 'uint256' },
          { name: 'creatorBetsAbove', type: 'bool' },
        ],
      },
      { name: 'creatorRequestedVoid', type: 'bool' },
      { name: 'challengerRequestedVoid', type: 'bool' },
      { name: 'arbitrationStart', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  // --- aggregate stat getters ---
  { inputs: [], name: 'totalVolume', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'totalResolved', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'totalWagerCount', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  {
    inputs: [
      { name: 'start', type: 'uint256' },
      { name: 'count', type: 'uint256' },
    ],
    name: 'getWagersPaginated',
    outputs: [{ type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'userWagerCount',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'start', type: 'uint256' },
      { name: 'count', type: 'uint256' },
    ],
    name: 'getUserWagers',
    outputs: [{ type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  { inputs: [], name: 'totalVoided', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'totalStandardWagers', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'totalPriceBets', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
] as const